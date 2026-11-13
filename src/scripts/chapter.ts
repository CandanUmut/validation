// A journey chapter: three passes (predict, fill the gaps, rebuild). Same rules as v1.
import { state, jLevel, rollDay, bump, markActive, save } from './store';
import { ladder } from './draw';
import { $, base, data, esc, hlLog, lcls, pad2, shuffle, dayNum } from './util';

type Step = { from: number; to: number; message: string; layer: string; what: string; log: string; why: string; answer: string };
type Ch = { id: string; order: number; title: string; lanes: string[]; steps: Step[] };
const { c: ch, next } = data<{ c: Ch; next: { id: string; title: string } | null }>('d-ch');
const S = ch.steps, N = S.length;
const NAMES = ['Guided walk', 'Fill the gaps', 'Rebuild from memory'];
const DESC = ['Predict each step before you see it, then explain why it happens.', 'Half the steps are missing. Put each one back where it belongs.', 'Every step shuffled. Rebuild the order, then explain three steps out loud.'];

type P1 = { mode: 1; i: number; right: number; pick: number | null; opts: string[]; why: boolean; finished?: boolean };
type P2 = { mode: 2; order: number[]; at: number; right: number; total: number; pick: number | null; ok: boolean; wrong: Set<number>; opts: number[] };
type P3 = { mode: 3; placed: number; mistakes: number; opts: number[]; flash: number | null; stage: 'order' | 'explain' | 'done'; ex: number[]; exAt: number; shown: boolean; got: number };
let p: P1 | P2 | P3 | null = null;
let doneInfo: { m: number; passed: boolean; line: string; rule: string } | null = null;

const dir = (s: Step) => (s.from === s.to ? `inside ${esc(ch.lanes[s.from])}` : `${esc(ch.lanes[s.from])} → ${esc(ch.lanes[s.to])}`);
const opt = (act: string, v: number, text: string, cls = '', disabled = false, mono = true) => `<button class="opt${mono ? ' mono' : ''}${cls}" data-a="${act}" data-v="${v}"${disabled ? ' disabled' : ''}>${esc(text)}</button>`;
const meter = (x: number) => `<div class="meter"><span style="width:${Math.round(Math.min(1, x) * 100)}%"></span></div>`;
const head = (m: number, right: string, x: number) => `<div class="sess"><button class="back" data-a="quit">‹ Leave</button>${meter(x)}<span class="eyebrow">${right}</span></div><span class="eyebrow">P${m} · <b>${NAMES[m - 1]}</b></span>`;
function stepCard(k: number, withWhy: boolean) {
  const s = S[k];
  return `<div class="card stepc" style="margin-top:14px"><div class="hd"><span class="layer ${lcls(s.layer)}">${esc(s.layer)}</span><span>Step ${pad2(k + 1)} / ${pad2(N)} · ${dir(s)}</span></div><p class="m">${esc(s.message)}</p><p>${esc(s.what)}</p><div class="logline" style="margin-top:10px">${hlLog(s.log)}</div>` +
    (withWhy ? `<div class="why"><p class="wq">${esc(s.why)}</p><p class="wa">${esc(s.answer)}</p></div>` : '') + '</div>';
}

function overview() {
  const lv = jLevel(ch.id);
  $('#lvtxt')!.textContent = `${lv}/3 done`;
  $('#passes')!.innerHTML = [1, 2, 3].map((m) => { const done = lv >= m, nx = lv === m - 1; return `<button class="pcard${nx ? ' cur' : ''}" data-a="start" data-v="${m}"><span class="n">P${m}</span><span class="t">${NAMES[m - 1]}</span><span class="s">${DESC[m - 1]}</span>${done ? '<span class="tag pass">Pass</span>' : nx ? '<span class="tag next">Start</span>' : '<span class="tag none">Open</span>'}</button>`; }).join('');
  $('#study')!.hidden = lv < 1; $('#hidden-note')!.hidden = lv >= 1; const nb = $('#next-ch'); if (nb) nb.hidden = lv < 1;
}

function start(m: number) {
  doneInfo = null;
  if (m === 1) { p = { mode: 1, i: 0, right: 0, pick: null, opts: [], why: false }; p1opts(); }
  else if (m === 2) { const hid = shuffle(S.map((_, i) => i)).slice(0, Math.ceil(N / 2)).sort((a, b) => a - b); p = { mode: 2, order: hid, at: 0, right: 0, total: hid.length, pick: null, ok: false, wrong: new Set(), opts: shuffle(hid) }; }
  else p = { mode: 3, placed: 0, mistakes: 0, opts: shuffle(S.map((_, i) => i)), flash: null, stage: 'order', ex: shuffle(S.map((_, i) => i)).slice(0, 3), exAt: 0, shown: false, got: 0 };
}
function p1opts() {
  const j = p as P1, correct = S[j.i].message, pool = S.map((s) => s.message).filter((m) => m !== correct);
  let picks = shuffle(S.slice(j.i + 1).map((s) => s.message)).slice(0, 2);
  picks = picks.concat(shuffle(pool.filter((m) => !picks.includes(m))).slice(0, 3 - picks.length));
  j.opts = shuffle([correct, ...picks]); j.pick = null; j.why = false;
}
function finish(m: number, passed: boolean, line: string, rule: string) {
  rollDay(); const s = state.j[ch.id] || (state.j[ch.id] = { lv: 0 });
  if (passed && s.lv < m) s.lv = m; if (passed) state.day.jp = 1;
  bump(2); markActive(); save(); doneInfo = { m, passed, line, rule };
}

function play(): string {
  if (doneInfo) {
    const { m, passed, line, rule } = doneInfo;
    const what = passed ? (m === 1 ? 'The why-questions from this chapter now come first in your daily review.' : m === 2 ? 'Leave a gap before pass 3. Tomorrow is better than right now.' : 'This chapter is rebuilt. Review will bring its questions back at longer and longer gaps.') : 'Open the study view, read the steps you missed, and try again later today or tomorrow.';
    return `<div class="head"><span class="eyebrow">Chapter ${pad2(ch.order)} · P${m}</span><h1 class="h h2">${passed ? `Pass ${m} complete` : 'Not yet'}</h1><p class="sub">${line} ${passed ? '' : rule}</p></div>` +
      `<div class="msg ${passed ? 'pass' : 'inc'}"><span class="lab">${passed ? 'What happens now' : 'What to do'}</span>${what}</div>` +
      `<div class="stackb"><button class="btn pri" data-a="quit">Back to the chapter</button><button class="btn quiet" data-a="start" data-v="${m}">Run this pass again</button>${next && passed ? `<a class="btn quiet" href="${base()}journey/${next.id}/">Next chapter ›</a>` : ''}</div>`;
  }
  if (!p) return '';
  if (p.mode === 1) {
    const j = p, st = S[j.i], ans = j.pick !== null;
    let h = head(1, `${pad2(j.i + 1)} / ${pad2(N)}`, (j.i + (ans ? 1 : 0)) / N) + `<h1 class="h h2">${ans ? esc(st.message) : 'What happens next?'}</h1>`;
    h += ladder(ch.lanes, S, { upto: ans ? j.i + 1 : j.i, now: ans ? j.i : undefined, fresh: ans ? j.i : undefined });
    if (!ans) return h + `<p class="sub" style="margin-top:14px">${j.i === 0 ? 'This is the first step of the chapter. Which one is it?' : `You have seen ${j.i} step${j.i === 1 ? '' : 's'}. Say your guess out loud, then tap it.`}</p><div class="opts">${j.opts.map((o, k) => opt('p1', k, o)).join('')}</div>`;
    const ok = j.opts[j.pick!] === st.message;
    h += `<div class="msg ${ok ? 'pass' : 'fail'}"><span class="lab">${ok ? 'Predicted' : 'Not this time'}</span>${ok ? 'Good. Now explain why it happens before you read on.' : `You picked <span class="mono">${esc(j.opts[j.pick!])}</span>. A wrong guess still helps you remember the right one.`}</div>`;
    h += stepCard(j.i, false);
    h += `<div class="card" style="margin-top:12px"><span class="lab">Explain it to yourself</span><p style="font-weight:700;font-size:18px">${esc(st.why)}</p>${j.why ? `<p style="margin-top:8px;color:var(--ink-soft)">${esc(st.answer)}</p>` : '<button class="btn quiet" style="margin-top:12px;width:100%" data-a="why">I have my answer. Show it</button>'}</div>`;
    return h + `<div class="stackb"><button class="btn pri" data-a="p1next"${j.why ? '' : ' disabled'}>${j.i + 1 < N ? 'Next step' : 'Finish pass 1'}</button></div>`;
  }
  if (p.mode === 2) {
    const j = p, gap = j.order[j.at], ans = j.pick !== null && j.ok, still = new Set(j.order.slice(ans ? j.at + 1 : j.at));
    let h = head(2, `${j.at + 1} / ${j.total}`, (j.at + (ans ? 1 : 0)) / j.total) + `<h1 class="h h2">Which step fills gap ${gap + 1}?</h1>`;
    h += ladder(ch.lanes, S, { hidden: still, fresh: ans ? gap : undefined });
    h += '<div class="opts">' + j.opts.map((k) => { const used = !still.has(k) && !(ans && k === gap); const c = ans && k === gap ? ' right' : j.wrong.has(k) ? ' wrong' : ''; return opt('p2', k, S[k].message, c + (used ? ' used' : ''), used || ans); }).join('') + '</div>';
    if (ans) h += `<div class="msg pass"><span class="lab">Step ${pad2(gap + 1)} · ${esc(S[gap].layer)}</span>${esc(S[gap].what)}</div><div class="stackb"><button class="btn pri" data-a="p2next">${j.at + 1 < j.total ? 'Next gap' : 'Finish pass 2'}</button></div>`;
    else if (j.wrong.size) h += '<div class="msg fail"><span class="lab">Not that one</span>Look at what comes just before and just after the gap, and who is talking to whom.</div>';
    return h;
  }
  const j = p;
  if (j.stage === 'order') {
    let h = head(3, `${j.placed} / ${N} · ${j.mistakes} wrong`, j.placed / N) + '<h1 class="h h2">Rebuild the flow</h1><p class="sub">Tap the steps in the order they happen.</p>';
    if (j.placed) h += `<div class="card" style="margin-top:14px"><ol class="built">${S.slice(0, j.placed).map((s) => `<li>${esc(s.message)}</li>`).join('')}</ol></div>`;
    return h + '<div class="opts">' + j.opts.filter((k) => k >= j.placed).map((k) => opt('p3', k, S[k].message, j.flash === k ? ' wrong' : '')).join('') + '</div>';
  }
  const k = j.ex[j.exAt], st = S[k];
  let h = head(3, `Explain ${j.exAt + 1} / ${j.ex.length}`, j.exAt / j.ex.length) + '<h1 class="h h2">Say the answer out loud</h1>';
  h += `<div class="card flash" style="margin-top:14px"><div class="stepc"><div class="hd"><span class="layer ${lcls(st.layer)}">${esc(st.layer)}</span><span>Step ${pad2(k + 1)} · ${esc(st.message)}</span></div></div><p class="prompt">${esc(st.why)}</p>${j.shown ? `<p class="ans">${esc(st.answer)}</p>` : ''}</div>`;
  return h + (j.shown ? '<div class="pair"><button class="btn fail" data-a="ex" data-v="0">I missed it</button><button class="btn pass" data-a="ex" data-v="1">I had it</button></div>' : '<div class="stackb"><button class="btn pri" data-a="show">Show the answer</button></div>');
}

function render(top = false) {
  const playing = !!(p || doneInfo);
  $('#overview')!.hidden = playing; $('#play')!.hidden = !playing;
  if (playing) $('#play')!.innerHTML = play(); else overview();
  if (top) window.scrollTo(0, 0);
}

document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-a]'); if (!b) return;
  const a = b.dataset.a!, v = b.dataset.v === undefined ? -1 : +b.dataset.v; let top = false, focus = '';
  switch (a) {
    case 'start': start(v); top = true; break;
    case 'quit': p = null; doneInfo = null; top = true; break;
    case 'p1': { const j = p as P1; j.pick = v; if (j.opts[v] === S[j.i].message) j.right++; focus = '[data-a=why]'; break; }
    case 'why': (p as P1).why = true; focus = '[data-a=p1next]'; break;
    case 'p1next': { const j = p as P1; if (j.i + 1 < N) { j.i++; p1opts(); } else { p = null; finish(1, true, `You predicted ${j.right} of ${N} steps before seeing them.`, ''); } top = true; break; }
    case 'p2': { const j = p as P2, gap = j.order[j.at]; if (j.ok) return; if (v === gap) { j.pick = v; j.ok = true; if (!j.wrong.size) j.right++; focus = '[data-a=p2next]'; } else j.wrong.add(v); break; }
    case 'p2next': { const j = p as P2; j.at++; j.pick = null; j.ok = false; j.wrong = new Set(); if (j.at >= j.total) { p = null; finish(2, j.right / j.total >= 0.8, `You placed ${j.right} of ${j.total} gaps on the first try.`, 'Pass 2 counts at 80% or more on the first try.'); } top = true; break; }
    case 'p3': { const j = p as P3; if (v === j.placed) { j.placed++; j.flash = null; if (j.placed === N) { j.stage = 'explain'; top = true; } } else { j.mistakes++; j.flash = v; } break; }
    case 'show': (p as P3).shown = true; focus = '[data-a=ex]'; break;
    case 'ex': { const j = p as P3, id = `jq-${ch.id}-${j.ex[j.exAt]}`; if (v) j.got++; else state.r[id] = { ...(state.r[id] || { m: 0 }), b: 0, due: dayNum(), n: (state.r[id]?.n || 0) + 1 }; j.exAt++; j.shown = false;
      if (j.exAt >= j.ex.length) { const ok = j.mistakes <= 2; p = null; finish(3, ok, `You rebuilt ${N} steps with ${j.mistakes} wrong tap${j.mistakes === 1 ? '' : 's'}, and explained ${j.got} of ${j.ex.length}.`, 'Pass 3 counts with 2 wrong taps or fewer.'); } else save(); top = true; break; }
    default: return;
  }
  const y = window.scrollY; render(top); if (!top) window.scrollTo(0, y);
  if (focus) $(focus)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
render();
