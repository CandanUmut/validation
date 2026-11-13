// The review deck and its schedule (same rules as v1: boxes with growing gaps).
import { state, rollDay, markActive, bump, save, jLevel } from './store';
import { base, dayNum } from './util';
export type Card = { id: string; f: string; b: string; g: string; ch?: string; pr: 0 | 1 | 2; term?: true };
export const INTERVALS = [1, 2, 4, 8, 16, 32, 64, 120];
let cache: Card[] | null = null;
export async function loadCards(): Promise<Card[]> { if (!cache) cache = await (await fetch(base() + 'data/cards.json')).json(); return cache!; }
export const dueCards = (cards: Card[]) => { const t = dayNum(); return cards.filter((c) => state.r[c.id] && state.r[c.id].due <= t); };
export function newCards(cards: Card[]) {
  rollDay();
  const left = Math.max(0, state.set.newPerDay - state.day.nw);
  if (!left) return [];
  const pool = cards.filter((c) => !state.r[c.id]).map((c, i) => ({ c, i, p: c.pr === 0 ? (jLevel(c.ch!) >= 1 ? 0 : 3) : c.pr }));
  pool.sort((a, b) => a.p - b.p || a.i - b.i);
  return pool.slice(0, left).map((x) => x.c);
}
export function grade(card: Card, g: number, again: boolean) {
  rollDay();
  const t = dayNum(), prev = state.r[card.id], isNew = !prev, n = (prev?.n || 0) + 1, m = prev?.m || 0;
  if (g === 0) state.r[card.id] = { b: 0, due: t + 1, n, m: again ? m : m + 1 };
  else if (!again) { const b = Math.min(INTERVALS.length - 1, (prev ? prev.b : 0) + g); state.r[card.id] = { b, due: t + INTERVALS[b], n, m }; }
  if (!again) { bump(0); if (g === 0) bump(1); }
  if (isNew) state.day.nw++;
  state.day.done++;
  markActive(); save();
}
export const nextGap = (card: Card, g: number) => INTERVALS[Math.min(INTERVALS.length - 1, (state.r[card.id] ? state.r[card.id].b : 0) + g)];
export function forecast(cards: Card[], days: number) { const t = dayNum(), ids = new Set(cards.map((c) => c.id)), out = new Array(days).fill(0); for (const id in state.r) { if (!ids.has(id)) continue; const k = Math.max(0, state.r[id].due - t); if (k < days) out[k]++; } return out as number[]; }
export function missRate7() { const t = dayNum(); let a = 0, m = 0; for (let d = t - 6; d <= t; d++) { const h = state.hist[d]; if (h) { a += h[0]; m += h[1]; } } return { a, m, r: a ? m / a : 0 }; }
