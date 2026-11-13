// A case file: annotated log, decisions as a debug trail, root cause, bug title. Same scoring as v1.
import { state, rollDay, bump, markActive, save } from './store';
import { $, base, data, esc, hlLog, shuffle } from './util';

type Opt = { text: string; score: 0 | 1 | 2; feedback: string };
type C = { id: string; title: string; log: string[]; decisions: { question: string; options: Opt[] }[]; cause: { question: string; options: string[]; answer: number; feedback: string }; bug: string; learn: string[] };
const { c, next } = data<{ c: C; code: string; next: { id: string; code: string } | null }>('d-case');
const D = c.decisions, MAX = D.length * 2 + 2;
const verdict = (x: number) => (x >= 0.85 ? ['pass', 'Pass'] : x >= 0.6 ? ['inc', 'Inconc'] : ['fail', 'Fail']);

let u = fresh();
function fresh() { return { i: 0, score: 0, pick: null as number | null, picks: [] as number[], order: D.map((n) => shuffle(n.options.map((_, k) => k))), causeOrder: shuffle(c.cause.options.map((_, k) => k)), stage: 'nodes' as 'nodes' | 'cause' | 'done', causePick: null as number | null, bugShown: false, bugText: '', marks: new Set<number>(), wrap: true }; }

function record() {
  const s = state.c[c.id];
  $('#record')!.innerHTML = s ? `<p class="note" style="margin-top:4px"><span class="tag ${verdict(s.best)[0]}">${verdict(s.best)[1]}</span> best ${Math.round(s.best * 100)}% · ${s.n} run${s.n === 1 ? '' : 's'}</p>` : '';
}
const scoreTag = (s: number) => (s === 2 ? '<span class="tag pass">+2</span>' : s === 1 ? '<span class="tag inc">+1</span>' : '<span class="tag fail">+0</span>');

function view() {
  let h = `<div class="log bleed${u.wrap ? ' wrap' : ''}" style="margin-top:16px" role="list" aria-label="Case log, simplified">` + c.log.map((l, i) => `<button class="ln${u.marks.has(i) ? ' hl' : ''}" data-a="mark" data-v="${i}" role="listitem" aria-pressed="${u.marks.has(i)}"><i>${i + 1}</i><span>${hlLog(l)}</span></button>`).join('') + '</div>';
  h += `<div class="logbar"><span class="note">Tap a line to highlight it as evidence.</span><button class="chip" data-a="wrap">${u.wrap ? 'No wrap' : 'Wrap lines'}</button></div>`;
  h += `<div class="sec dt"><div class="sh">Debug trail<span class="r">${Math.min(u.stage === 'nodes' ? u.i : D.length, D.length)} of ${D.length}</span></div>`;
  D.forEach((n, i) => {
    if (u.stage === 'nodes' && i > u.i) { h += `<div class="st"><span class="pt">${i + 1}</span><div><p class="q past">Decision ${i + 1}</p></div></div>`; return; }
    if (u.stage === 'nodes' && i === u.i) {
      const ans = u.pick !== null;
      h += `<div class="st"><span class="pt cur">${i + 1}</span><div><p class="q">${esc(n.question)}</p><div class="opts">` + u.order[i].map((k) => { const o = n.options[k]; let cl = ''; if (ans) { if (o.score === 2) cl = ' right'; else if (k === u.pick) cl = o.score === 1 ? ' ok' : ' wrong'; } return `<button class="opt${cl}" data-a="pick" data-v="${k}"${ans ? ' disabled' : ''}>${esc(o.text)}</button>`; }).join('') + '</div>';
      if (ans) { const o = n.options[u.pick!]; h += `<div class="msg ${o.score === 2 ? 'pass' : o.score === 1 ? 'inc' : 'fail'}"><span class="lab">${o.score === 2 ? 'Best next move · +2' : o.score === 1 ? 'Reasonable, but slower · +1' : 'Wrong turn · +0'}</span>${esc(o.feedback)}${o.score === 2 ? '' : ' Best move: ' + esc(n.options.find((x) => x.score === 2)!.text) + '.'}</div><button class="btn pri" style="width:100%" data-a="next">Continue</button>`; }
      h += '</div></div>'; return;
    }
    const o = n.options[u.picks[i]];
    h += `<div class="st"><span class="pt ${o.score === 2 ? 'pass' : o.score === 1 ? 'inc' : 'fail'}">${i + 1}</span><div><p class="q past">${esc(n.question)}</p><p class="pk">${scoreTag(o.score)}<span>${esc(o.text)}</span></p></div></div>`;
  });
  if (u.stage === 'nodes') h += '<div class="st"><span class="pt">RC</span><div><p class="q past">Root cause</p></div></div>';
  else {
    const ans = u.causePick !== null, ok = u.causePick === c.cause.answer;
    h += `<div class="st"><span class="pt ${u.stage === 'cause' ? 'cur' : ok ? 'pass' : 'fail'}">RC</span><div><p class="q">${esc(c.cause.question)}</p>`;
    if (u.stage === 'cause') {
      h += '<div class="opts">' + u.causeOrder.map((k) => { let cl = ''; if (ans) { if (k === c.cause.answer) cl = ' right'; else if (k === u.causePick) cl = ' wrong'; } return `<button class="opt${cl}" data-a="cause" data-v="${k}"${ans ? ' disabled' : ''}>${esc(c.cause.options[k])}</button>`; }).join('') + '</div>';
      if (ans) h += `<div class="msg ${ok ? 'pass' : 'fail'}"><span class="lab">${ok ? 'Correct · +2' : 'Not correct · +0'}</span>${esc(c.cause.feedback)}</div><button class="btn pri" style="width:100%" data-a="next">Close the case</button>`;
    } else h += `<p class="pk">${scoreTag(ok ? 2 : 0)}<span>${esc(c.cause.options[u.causePick!])}</span></p>`;
    h += '</div></div>';
  }
  h += '</div>';
  if (u.stage === 'done') {
    const sc = u.score / MAX, v = verdict(sc);
    h += `<div class="sec"><div class="sh">Verdict</div><div class="ready"><span class="big">${u.score}<span style="font-size:28px;color:var(--ink-soft)">/${MAX}</span></span><div><span class="tag ${v[0]}">${v[1]}</span><p class="note" style="margin-top:6px">${Math.round(sc * 100)}% of points. Best moves score 2, slower ones 1.</p></div></div></div>`;
    h += `<div class="sec"><div class="sh">Bug report</div><label for="bug" style="font-weight:700">Write the bug title yourself first</label><p class="note" style="margin:4px 0 10px">One line: what fails, where, how often, with numbers.</p><textarea class="field" id="bug" placeholder="[area] symptom when condition, n/N runs, build X">${esc(u.bugText)}</textarea>` +
      (u.bugShown ? `<div class="msg quiet"><span class="lab">Model title</span><span class="mono small">${esc(c.bug)}</span></div>` : '<button class="btn quiet" style="width:100%;margin-top:10px" data-a="bug">Compare with a model title</button>') + '</div>';
    h += `<div class="sec"><div class="sh">Take away</div><ul class="prose" style="padding-left:1.15em;display:flex;flex-direction:column;gap:8px;margin:0">${c.learn.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    h += `<div class="stackb">${next ? `<a class="btn pri" href="${base()}cases/${next.id}/">Next: ${next.code} ›</a>` : `<a class="btn pri" href="${base()}cases/">All cases</a>`}<button class="btn quiet" data-a="again">Work this case again</button></div>`;
  }
  return h;
}
function render(top = false) { const y = window.scrollY; record(); $('#case')!.innerHTML = view(); window.scrollTo(0, top ? 0 : y); }

document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-a]'); if (!b) return;
  const a = b.dataset.a!, v = b.dataset.v === undefined ? -1 : +b.dataset.v; let focus = '';
  switch (a) {
    case 'mark': if (u.marks.has(v)) u.marks.delete(v); else u.marks.add(v); b.classList.toggle('hl'); b.setAttribute('aria-pressed', String(u.marks.has(v))); return;
    case 'wrap': u.wrap = !u.wrap; break;
    case 'pick': if (u.pick !== null) return; u.pick = v; u.picks[u.i] = v; u.score += D[u.i].options[v].score; focus = '[data-a=next]'; break;
    case 'cause': if (u.causePick !== null) return; u.causePick = v; if (v === c.cause.answer) u.score += 2; focus = '[data-a=next]'; break;
    case 'next':
      if (u.stage === 'nodes') { u.pick = null; if (u.i + 1 < D.length) u.i++; else u.stage = 'cause'; }
      else { u.stage = 'done'; rollDay(); const s = state.c[c.id] || { best: 0, n: 0 }; s.best = Math.max(s.best, u.score / MAX); s.n++; state.c[c.id] = s; state.day.cs = 1; bump(2); markActive(); save(); }
      break;
    case 'bug': u.bugShown = true; u.bugText = ($('#bug') as HTMLTextAreaElement | null)?.value || ''; break;
    case 'again': u = fresh(); render(true); return;
    default: return;
  }
  render(); if (focus) $(focus)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
document.addEventListener('input', (e) => { const t = e.target as HTMLElement; if (t.id === 'bug') u.bugText = (t as HTMLTextAreaElement).value; });
render();
