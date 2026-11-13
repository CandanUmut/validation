// Progress, kept in this browser only. The format is unchanged since v1 so old progress carries over.
import { dayNum, toast } from './util';
const KEY = 'ran-validation-v1';
export type Rec = { b: number; due: number; n: number; m?: number };
export type State = {
  v: 1; j: Record<string, { lv: number }>; c: Record<string, { best: number; n: number }>; r: Record<string, Rec>;
  day: { d: number; nw: number; done: number; jp?: number; cs?: number }; streak: { last: number; n: number; best?: number };
  set: { newPerDay: number; theme?: string }; lessons: Record<string, 1>; hist: Record<string, [number, number, number]>; updated: number;
};
export const blank = (): State => ({ v: 1, j: {}, c: {}, r: {}, day: { d: 0, nw: 0, done: 0, jp: 0, cs: 0 }, streak: { last: 0, n: 0, best: 0 }, set: { newPerDay: 10, theme: 'auto' }, lessons: {}, hist: {}, updated: 0 });
export function normalize(s: unknown): State {
  const b = blank() as Record<string, unknown>;
  if (s && typeof s === 'object') for (const k in b) { const v = (s as Record<string, unknown>)[k]; if (v !== undefined && v !== null && typeof v === typeof b[k] && Array.isArray(v) === Array.isArray(b[k])) b[k] = v; }
  return b as State;
}
export let state: State = blank();
try { const raw = localStorage.getItem(KEY); if (raw) state = normalize(JSON.parse(raw)); } catch { /* private mode: start blank */ }
export function replace(s: State) { state = s; }
export function save() {
  state.updated = Date.now();
  const cut = dayNum() - 400; for (const k in state.hist) if (+k < cut) delete state.hist[k];
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { toast('Could not save on this device'); }
}
export function rollDay() { const t = dayNum(); if (state.day.d !== t) state.day = { d: t, nw: 0, done: 0, jp: 0, cs: 0 }; }
export function markActive() { const t = dayNum(), s = state.streak; if (s.last !== t) { s.n = s.last === t - 1 ? s.n + 1 : 1; s.last = t; } s.best = Math.max(s.best || 0, s.n); }
/** hist[day] = [first-try answers, first-try misses, passes + cases + lessons] */
export function bump(i: 0 | 1 | 2, k = 1) { const t = dayNum(), h = state.hist[t] || (state.hist[t] = [0, 0, 0]); h[i] += k; }
export const jLevel = (id: string) => (state.j[id] || { lv: 0 }).lv || 0;
export const streakNow = () => (state.streak.last >= dayNum() - 1 ? state.streak.n : 0);
export function applyTheme() { const t = state.set.theme; if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
