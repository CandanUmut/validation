import { state, rollDay, jLevel, streakNow } from './store';
import { loadCards, dueCards, newCards, type Card } from './cards';
import { trace, constellation, spectrum } from './draw';
import { $, base, data, dayNum, dayDate, esc, pad2 } from './util';

type D = { ch: { id: string; title: string; order: number; steps: number }[]; cs: { id: string; title: string; order: number; tag: string; n: number }[]; mods: { id: string; code: string; title: string; lessons: string[] }[] };
const PASS = ['guided walk', 'fill the gaps', 'rebuild from memory'];
const d = data<D>('d-today'), B = base();

function nextChapter() { for (let lv = 0; lv < 3; lv++) { const c = d.ch.find((x) => jLevel(x.id) === lv); if (c) return { c, lv }; } return null; }
function nextCase() { return d.cs.find((c) => !state.c[c.id]) || d.cs.slice().sort((a, b) => state.c[a.id].best - state.c[b.id].best)[0]; }
const code = (o: number) => 'RAN-' + String(o).padStart(3, '0');

function weakest(cards: Card[]) {
  const by = new Map<string, Card[]>();
  for (const c of cards) if (state.r[c.id]) { const a = by.get(c.g) || []; a.push(c); by.set(c.g, a); }
  let best: { g: string; list: Card[]; weak: number } | null = null;
  for (const [g, list] of by) { const weak = list.filter((c) => state.r[c.id].b === 0 && (state.r[c.id].m || 0) > 0).length; if (!best || weak > best.weak || (weak === best.weak && list.length > best.list.length)) best = { g, list, weak }; }
  return best;
}

async function render() {
  rollDay();
  const cards = await loadCards(), due = dueCards(cards).length, nw = newCards(cards).length, ready = due + nw, day = state.day;
  const t = dayNum(), dow = (t + 3) % 7, week = Array.from({ length: 7 }, (_, i) => { const h = state.hist[t - dow + i]; return h ? h[0] + 3 * h[2] : 0; });
  const practised = week.slice(0, dow + 1).filter((v) => v > 0).length, date = dayDate(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const nc = nextChapter(), cs = nextCase();
  const items = [
    { href: B + 'review/', t: ready ? `Review ${ready} card${ready === 1 ? '' : 's'}` : 'Review', done: day.done > 0 && !ready, idle: !day.done && !ready, min: Math.max(1, Math.round(ready * 0.35)),
      m: ready ? `${due} due, ${nw} new · about ${Math.max(1, Math.round(ready * 0.35))} min` : day.done ? `Done · ${day.done} answered today` : 'Nothing due right now' },
    nc ? { href: B + `journey/${nc.c.id}/`, t: esc(nc.c.title), done: !!day.jp, idle: false, min: Math.round(nc.c.steps * 0.8), m: (day.jp ? 'A pass done today · next: ' : '') + `Journey ch. ${pad2(nc.c.order)} · pass ${nc.lv + 1}, ${PASS[nc.lv]} · ${Math.round(nc.c.steps * 0.8)} min` }
       : { href: B + 'journey/', t: 'Journey complete', done: !!day.jp, idle: false, min: 0, m: 'Rebuild any chapter to keep it sharp' },
    { href: B + `cases/${cs.id}/`, t: esc(cs.title), done: !!day.cs, idle: false, min: 6, m: (day.cs ? 'A case closed today · next: ' : '') + `Case ${code(cs.order)} · ${esc(cs.tag.toLowerCase())} · ` + (state.c[cs.id] ? `best ${Math.round(state.c[cs.id].best * 100)}%` : '6 min') },
  ];
  const left = items.filter((i) => !i.done && !i.idle), mins = left.reduce((a, i) => a + i.min, 0), cur = items.findIndex((i) => !i.done && !i.idle);
  const sub = !left.length ? 'All done for today. Anything more is extra.' : `${left.length === 3 ? 'Three things' : left.length === 2 ? 'Two things left' : 'One thing left'}, about ${mins} minutes.`;

  let h = `<div class="top-row" style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4px"><span class="eyebrow">This week</span><span class="eyebrow">${esc(date)}${streakNow() ? ' · ' + streakNow() + ' days in a row' : ''}</span></div>`;
  h += `<div class="bleed" style="margin-top:6px">${trace(week, dow)}<div class="tcap">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x, i) => `<span class="${week[i] > 0 ? 'on' : ''}">${x}</span>`).join('')}</div></div>`;
  h += `<p class="note" style="margin-top:8px">${practised} of ${dow + 1} days practised so far. Height is how much you did that day; the dot is today.</p>`;
  h += `<h1 class="h h1" style="margin-top:22px">Today</h1><p class="sub">${sub}</p>`;
  h += '<div class="sec plan">' + items.map((it, i) => `<a class="row${it.done ? ' done' : ''}${i === cur ? ' next' : ''}" href="${it.href}"><span class="n">${it.done ? '✓' : pad2(i + 1)}</span><span class="t">${it.t}</span><span class="m">${it.m}</span><span class="c" aria-hidden="true">›</span></a>`).join('') + '</div>';

  const w = weakest(cards);
  if (!w) h += `<div class="sec"><div class="sh">Your constellation</div><div class="card"><div class="const">${constellation([])}<div class="k">Each review card becomes a dot here. Cards you know sit on the crosses; cards you keep missing scatter.<br><br>Review your first cards and it starts to draw.</div></div><a class="btn pri" href="${B}review/" style="margin-top:14px">Start reviewing</a></div></div>`;
  else {
    const pts = w.list.map((c) => ({ id: c.id, b: state.r[c.id].b, m: state.r[c.id].m || 0 }));
    h += `<div class="sec"><div class="sh">${w.weak ? 'Weakest area' : 'Your strongest area'}</div><div class="card"><div class="ctitle"><b class="h h3">${esc(w.g)}</b><span>${w.list.length} card${w.list.length === 1 ? '' : 's'} started</span></div>` +
      `<div class="const">${constellation(pts)}<div class="k">Each dot is a card. Dots on the crosses are solid. ${w.weak ? `<b>${w.weak} red dot${w.weak === 1 ? '' : 's'}</b> ${w.weak === 1 ? 'is a card' : 'are cards'} you missed last time.` : 'No red dots: a clean link.'}<br><br>Like EVM: the cleaner the cloud, the cleaner the link.</div></div>` +
      (w.weak ? `<a class="btn pri" style="margin-top:14px" href="${B}review/?area=${encodeURIComponent(w.g)}">Practise the ${w.weak} weak card${w.weak === 1 ? '' : 's'}</a>` : '') + '</div></div>';
  }
  const mods = d.mods.map((m) => ({ code: m.code, title: m.title, frac: m.lessons.filter((id) => state.lessons[id]).length / m.lessons.length }));
  h += `<div class="sec"><div class="sh">Coverage · ${mods.length} modules</div><a href="${B}library/" aria-label="Open the library">${spectrum(mods)}</a><p class="note" style="margin-top:6px">Band height is the share of each module's lessons you have read. Dotted bands are not started.</p></div>`;
  h += '<p class="foot">Logs in this app are simplified teaching logs, not output from a real tool. All lessons, journey steps, cases and review cards have been checked against the 3GPP specs (Release 17) or marked as practice.</p>';
  $('#today')!.innerHTML = h;
}
render();
