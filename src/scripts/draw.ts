// The signature drawings (docs/design/DESIGN.md §3.1). Each one is computed from real progress.
import { esc, hash, lcls, pad2 } from './util';

const f1 = (n: number) => n.toFixed(1);

/** The trace: this week's practice as a signal. Amplitude = how much was done that day.
 *  Solid up to today, dotted after, a dot on today. */
export function trace(activity: number[], today: number) {
  const W = 390, H = 112, mid = 56, x0 = 14, w = W - 28, n = activity.length;
  const amp = activity.map((v, i) => (i > today ? 7 : v <= 0 ? 0 : 6 + Math.min(1, v / 30) * 32));
  const A = (t: number) => { const p = t * n - 0.5, i = Math.max(0, Math.min(n - 1, Math.floor(p))), j = Math.min(n - 1, i + 1), k = Math.min(1, Math.max(0, p - i)), s = (1 - Math.cos(Math.PI * k)) / 2; return amp[i] * (1 - s) + amp[j] * s; };
  const pts: [number, number, number][] = [];
  for (let s = 0; s <= 280; s++) { const t = s / 280; pts.push([x0 + t * w, mid - Math.sin(t * 2 * Math.PI * n * 1.5) * A(t), t]); }
  const cut = (today + 0.5) / n, path = (a: typeof pts) => 'M' + a.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L');
  const a = pts.filter((p) => p[2] <= cut), b = pts.filter((p) => p[2] >= cut), dot = a[a.length - 1];
  let s = `<svg class="draw" viewBox="0 0 ${W} ${H}" role="img" aria-label="Practice this week, day by day">`;
  for (let d = 0; d < n; d++) { const x = x0 + ((d + 0.5) / n) * w; s += `<line x1="${f1(x)}" y1="8" x2="${f1(x)}" y2="${H - 8}" stroke="var(--rule)" stroke-dasharray="2 4"/>`; }
  s += `<line x1="${x0}" y1="${mid}" x2="${W - x0}" y2="${mid}" stroke="var(--rule)"/>`;
  s += `<path d="${path(b)}" fill="none" stroke="var(--faint)" stroke-width="1.6" stroke-dasharray="1.5 5" stroke-linecap="round"/>`;
  s += `<path class="drawn" style="--len:1400" d="${path(a)}" fill="none" stroke="var(--trace)" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<g class="pop"><circle cx="${f1(dot[0])}" cy="${f1(dot[1])}" r="9" fill="var(--trace)" opacity=".16"/><circle cx="${f1(dot[0])}" cy="${f1(dot[1])}" r="4.5" fill="var(--trace)"/></g>`;
  return s + '</svg>';
}

/** 16-QAM constellation. Each point is one review card: on its cross when remembered, scattered when shaky.
 *  Red = missed the last time it was asked. */
export type Pt = { id: string; b: number; m: number };
export function constellation(cards: Pt[], size = 160) {
  const L = [-3, -1, 1, 3], c = size / 2, k = size / 8.6;
  let s = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Constellation: one dot per card">`;
  s += `<line x1="6" y1="${c}" x2="${size - 6}" y2="${c}" stroke="var(--rule)"/><line x1="${c}" y1="6" x2="${c}" y2="${size - 6}" stroke="var(--rule)"/>`;
  L.forEach((i) => L.forEach((q) => { const x = c + i * k, y = c - q * k; s += `<path d="M${f1(x - 4)} ${f1(y)}h8M${f1(x)} ${f1(y - 4)}v8" stroke="var(--faint)" stroke-width="1"/>`; }));
  for (const p of cards) {
    const slot = Math.floor(hash(p.id) * 16), i = L[slot % 4], q = L[slot >> 2];
    const weak = p.b === 0 && p.m > 0, sp = weak ? 0.62 : p.b <= 1 ? 0.32 : p.b <= 3 ? 0.17 : 0.07;
    const u1 = Math.max(1e-6, hash(p.id + 'u')), u2 = hash(p.id + 'v'), r = Math.sqrt(-2 * Math.log(u1));
    const x = c + (i + r * Math.cos(2 * Math.PI * u2) * sp) * k, y = c - (q + r * Math.sin(2 * Math.PI * u2) * sp) * k;
    s += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="${weak ? 3.2 : 2.6}" fill="${weak ? 'var(--fail)' : 'var(--trace)'}" opacity=".88"/>`;
  }
  return s + '</svg>';
}

/** The spectrum strip: one band per module; height = share of its lessons read. Dotted = not started. */
export function spectrum(mods: { code: string; frac: number; title: string }[]) {
  const W = 354, H = 100, base = 76, bw = W / mods.length;
  let s = `<svg class="draw" viewBox="0 0 ${W} ${H}" role="img" aria-label="Coverage across ${mods.length} modules">`;
  s += `<line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="var(--ink-soft)"/>`;
  mods.forEach((m, i) => {
    const x = i * bw + 2, w = bw - 4, h = Math.max(1.5, m.frac * 62), top = base - h;
    s += `<path d="M${f1(x)} ${base} V${f1(top + 4)} Q${f1(x)} ${f1(top)} ${f1(x + 4)} ${f1(top)} H${f1(x + w - 4)} Q${f1(x + w)} ${f1(top)} ${f1(x + w)} ${f1(top + 4)} V${base}" fill="${m.frac ? 'var(--trace)' : 'none'}" fill-opacity="${(0.18 + m.frac * 0.72).toFixed(2)}" stroke="var(--trace)" stroke-width="${m.frac ? 1.2 : 0.8}"${m.frac ? '' : ' stroke-dasharray="2 3"'}><title>${esc(m.title)}: ${Math.round(m.frac * 100)}%</title></path>`;
    s += `<text x="${f1(i * bw + bw / 2)}" y="${base + 16}" text-anchor="middle" font-family="var(--f-m)" font-size="9.5" fill="var(--ink-soft)">${esc(m.code)}</text>`;
  });
  return s + '</svg>';
}

/** The ladder: a message sequence chart, arrows coloured by protocol layer. */
export type Step = { from: number; to: number; message: string; layer: string };
export function ladder(lanes: string[], steps: Step[], opt: { upto?: number; hidden?: Set<number>; now?: number; fresh?: number } = {}) {
  const upto = opt.upto ?? steps.length, hidden = opt.hidden || new Set<number>(), n = lanes.length;
  const W = n === 2 ? 440 : n === 3 ? 620 : 740, mx = n === 4 ? 92 : 100, top = 50, rh = 46, maxLen = n === 2 ? 46 : n === 3 ? 50 : 42;
  const x = (i: number) => mx + (i * (W - 2 * mx)) / (n - 1), rows = Math.max(1, upto), H = top + rows * rh + 12;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Message sequence">`;
  lanes.forEach((l, i) => { const w = l.length * 7.6 + 22; s += `<line class="life" x1="${x(i)}" y1="34" x2="${x(i)}" y2="${H - 4}"/><rect x="${f1(x(i) - w / 2)}" y="8" width="${f1(w)}" height="26" rx="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2"/><text class="lane" x="${x(i)}" y="25.5" text-anchor="middle">${esc(l)}</text>`; });
  for (let k = 0; k < upto; k++) {
    const st = steps[k], y = top + k * rh + 30, hid = hidden.has(k);
    let label = hid ? '?  gap ' + (k + 1) : st.message; if (label.length > maxLen) label = label.slice(0, maxLen - 1) + '…';
    const tw = label.length * 6.6;
    s += `<g class="msg ${hid ? '' : lcls(st.layer)}">`;
    s += `<text class="sn" x="12" y="${y - 6}">${pad2(k + 1)}</text>` + (hid ? '' : `<text class="ly" x="12" y="${y + 6}">${esc(st.layer)}</text>`);
    const anim = opt.fresh === k ? ' class="drawn" style="--len:700"' : '';
    if (st.from === st.to || hid) {
      const b = hid ? (x(st.from) + x(st.to)) / 2 : x(st.from), cx = Math.min(Math.max(b, tw / 2 + 56), W - tw / 2 - 14);
      s += `<rect class="${hid ? 'gap' : opt.now === k ? 'now' : 'self'}" x="${f1(cx - tw / 2 - 10)}" y="${y - 20}" width="${f1(tw + 20)}" height="24" rx="5"/><text${hid ? ' class="q"' : ''} x="${f1(cx)}" y="${y - 4}" text-anchor="middle">${esc(label)}</text>`;
    } else {
      const x1 = x(st.from), x2 = x(st.to), dir = x2 > x1 ? 1 : -1, cx = Math.min(Math.max((x1 + x2) / 2, tw / 2 + 50), W - tw / 2 - 8);
      if (opt.now === k) s += `<rect class="now" x="${f1(cx - tw / 2 - 5)}" y="${y - 21}" width="${f1(tw + 10)}" height="17" rx="3"/>`;
      s += `<text x="${f1(cx)}" y="${y - 8}" text-anchor="middle">${esc(label)}</text><line${anim} x1="${x1}" y1="${y}" x2="${x2 - dir * 8}" y2="${y}"/><polygon points="${x2},${y} ${x2 - dir * 9},${y - 4.5} ${x2 - dir * 9},${y + 4.5}"/><circle cx="${x1}" cy="${y}" r="3" fill="var(--lc)"/>`;
    }
    s += '</g>';
  }
  return `<div class="ladder figure bleed">${s}</svg></div>${n > 2 ? '<p class="scroll-hint">Scroll sideways to see the whole flow.</p>' : ''}`;
}
