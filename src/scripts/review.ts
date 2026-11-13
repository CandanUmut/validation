// Daily review: say the answer out loud, then grade yourself. ?area=<group> practises that area's weak cards.
import { state, rollDay } from './store';
import { loadCards, dueCards, newCards, grade, nextGap, forecast, missRate7, type Card } from './cards';
import { badge } from './chrome';
import { $, base, dayNum, dayDate, esc, shuffle } from './util';

let cards: Card[] = [];
let s: { queue: { c: Card; again: boolean }[]; shown: boolean; done: number; missed: number; label: string } | null = null;
const area = new URLSearchParams(location.search).get('area');

function start(list: Card[], label: string) { s = { queue: shuffle(list).map((c) => ({ c, again: false })), shown: false, done: 0, missed: 0, label }; }
const weakIn = (g: string) => cards.filter((c) => c.g === g && state.r[c.id] && state.r[c.id].b === 0 && (state.r[c.id].m || 0) > 0);

function landing() {
  rollDay();
  const due = dueCards(cards).length, nw = newCards(cards).length, ready = due + nw, mr = missRate7();
  const boxes = [0, 0, 0, 0]; cards.forEach((c) => { const r = state.r[c.id]; if (!r) boxes[0]++; else if (r.b <= 1) boxes[1]++; else if (r.b <= 3) boxes[2]++; else boxes[3]++; });
  let h = `<span class="eyebrow">Review · <b>${state.day.done}</b> answered today</span><h1 class="h h1">Daily review</h1><p class="sub">Say each answer out loud before you look. Missed cards come back tomorrow; known cards come back after longer and longer gaps: 2, 4, 8, 16 days and on.</p>`;
  h += `<div class="sec ready"><span class="big">${ready}</span><div><p style="font-weight:700;font-size:18px">${ready ? 'Cards ready' : 'All caught up'}</p><p class="note">${due} due, ${nw} new · about ${Math.max(1, Math.round(ready * 0.35))} min</p></div></div>`;
  h += ready ? '<div class="stackb"><button class="btn pri" data-a="start">Start review</button></div>' : `<p class="note" style="margin-top:12px">Come back tomorrow, or raise new cards per day in <a href="${base()}settings/">Settings</a>.</p>`;
  if (area && weakIn(area).length) h += `<div class="stackb"><button class="btn quiet" data-a="weak">Practise ${weakIn(area).length} weak card${weakIn(area).length === 1 ? '' : 's'} in ${esc(area)}</button></div>`;
  h += `<div class="sec"><div class="sh">Miss rate · last 7 days</div>${mr.a >= 10 ? `<div class="kv"><div><span class="v">${(mr.r * 100).toFixed(0)}%</span><span class="l">of ${mr.a} first tries were missed</span></div><div><span class="l" style="padding-top:6px">${mr.r < 0.05 ? 'Under 5%: this is easy for you. You can take more new cards per day.' : mr.r <= 0.15 ? 'Between 5% and 15%: a good pace. Keep it.' : 'Over 15%: too many misses. Take fewer new cards, or walk the chapter first.'}</span></div></div>` : '<p class="note">Shows after 10 first-try answers in a week. Spaced practice works best when you miss about 1 card in 10.</p>'}</div>`;
  h += `<div class="sec"><div class="sh">Deck · ${cards.length} cards</div><div class="kv">${[['Not started', boxes[0]], ['Learning (1–2 days)', boxes[1]], ['Settling (4–8 days)', boxes[2]], ['Holding (16 days+)', boxes[3]]].map(([l, v]) => `<div><span class="v">${v}</span><span class="l">${l}</span></div>`).join('')}</div><p class="note" style="margin-top:12px">The why-question of every journey step, key numbers and timers, and every term. New cards from chapters you have walked come first.</p></div>`;
  const fc = forecast(cards, 14), mx = Math.max(4, ...fc), t = dayNum();
  h += `<div class="sec"><div class="sh">Due · next 14 days</div><div class="fc" role="img" aria-label="Cards due per day for 14 days">${fc.map((v, i) => `<div><strong>${v || ''}</strong><span style="height:${(v / mx) * 66}px"></span><em>${'SMTWTFS'[dayDate(t + i).getUTCDay()]}</em></div>`).join('')}</div></div>`;
  return h;
}
function session() {
  const v = s!;
  if (!v.queue.length) return `<span class="eyebrow">${esc(v.label)} · done</span><h1 class="h h1">Review done</h1><p class="sub">${v.done} cards answered, ${v.missed} missed. Missed cards come back tomorrow.</p><div class="stackb"><a class="btn pri" href="${base()}">Back to Today</a>${newCards(cards).length ? '<button class="btn quiet" data-a="start">More new cards</button>' : ''}</div>`;
  const it = v.queue[0], c = it.c, isNew = !state.r[c.id];
  let h = `<div class="sess"><button class="back" data-a="stop">‹ Stop</button><div class="meter"><span style="width:${(v.done / Math.max(1, v.done + v.queue.length)) * 100}%"></span></div><span class="eyebrow">${v.queue.length} left</span></div>`;
  h += `<div class="card flash" style="margin-top:10px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="eyebrow">${esc(c.g)}</span>${isNew ? '<span class="tag next">New</span>' : ''}${it.again ? '<span class="tag fail">Again</span>' : ''}</div>` +
    (c.term ? `<p class="note">What is it, and where does it matter?</p><p class="prompt mono">${esc(c.f)}</p>` : `<p class="prompt">${esc(c.f)}</p>`) + (v.shown ? `<p class="ans">${esc(c.b)}</p>` : '') + '</div>';
  h += v.shown ? `<div class="grade"><button class="btn fail" data-a="grade" data-v="0">Missed<small>tomorrow</small></button><button class="btn inc" data-a="grade" data-v="1">With effort<small>${it.again ? 'tomorrow' : nextGap(c, 1) + ' days'}</small></button><button class="btn pass" data-a="grade" data-v="2">Easy<small>${it.again ? 'tomorrow' : nextGap(c, 2) + ' days'}</small></button></div>`
    : '<div class="stackb"><button class="btn pri" data-a="show" style="min-height:60px">Show the answer</button></div>';
  return h;
}
function render() { $('#review')!.innerHTML = s ? session() : landing(); }

document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-a]'); if (!b) return;
  const a = b.dataset.a!;
  if (a === 'start') start(dueCards(cards).concat(newCards(cards)), 'Daily review');
  else if (a === 'weak' && area) start(weakIn(area), area);
  else if (a === 'stop') s = null;
  else if (a === 'show') s!.shown = true;
  else if (a === 'grade') { const v = +b.dataset.v!, it = s!.queue.shift()!; grade(it.c, v, it.again); s!.done++; if (v === 0) { s!.missed++; s!.queue.push({ c: it.c, again: true }); } s!.shown = false; badge(); }
  else return;
  render(); window.scrollTo(0, 0);
});
loadCards().then((c) => { cards = c; if (area && weakIn(area).length) start(weakIn(area), area); render(); });
