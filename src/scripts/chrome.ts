// Bottom-nav badge: cards ready to review. Counted from saved progress, no fetch needed.
import { state, rollDay } from './store';
import { $, dayNum } from './util';
export function badge() {
  rollDay();
  const total = +(document.body.dataset.cards || 0), t = dayNum();
  let due = 0, started = 0; for (const id in state.r) { started++; if (state.r[id].due <= t) due++; }
  const fresh = Math.min(Math.max(0, state.set.newPerDay - state.day.nw), Math.max(0, total - started));
  const n = due + fresh, a = $('.nav a[data-tab="review"]');
  if (!a) return;
  a.querySelector('.badge')?.remove();
  if (n) a.insertAdjacentHTML('beforeend', `<span class="badge" aria-label="${n} cards ready">${n > 99 ? '99+' : n}</span>`);
}
