// WCAG 2.2 contrast for every text token on every background, in light and dark.
// Text needs 4.5:1. Non-text marks (rule-strong, layer colours used for arrows) need 3:1.
import { palettes } from '../src/styles/palettes.mjs';
const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const text = ['ink', 'ink-soft', 'faint', 'trace', 'pass', 'fail', 'inc', 'L-phy', 'L-mac', 'L-rlc', 'L-pdcp', 'L-rrc', 'L-nas', 'L-ap'];
const pairs = [['on-trace', 'trace'], ['ink', 'marker'], ['ink', 'trace-soft'], ['pass', 'pass-soft'], ['fail', 'fail-soft'], ['inc', 'inc-soft']];
let failed = 0;
for (const [name, p] of Object.entries(palettes)) {
  const rows = [];
  for (const bg of ['paper', 'card']) for (const t of text) { const r = ratio(p[t], p[bg]); if (r < 4.5) failed++; rows.push(`${t} on ${bg}: ${r.toFixed(2)}${r < 4.5 ? '  FAIL' : ''}`); }
  for (const [t, bg] of pairs) { const r = ratio(p[t], p[bg]); if (r < 4.5) failed++; rows.push(`${t} on ${bg}: ${r.toFixed(2)}${r < 4.5 ? '  FAIL' : ''}`); }
  const r = ratio(p['rule-strong'], p.paper); if (r < 3) failed++; rows.push(`rule-strong on paper: ${r.toFixed(2)} (non-text, needs 3)${r < 3 ? '  FAIL' : ''}`);
  console.log(`\n${name}\n  ` + rows.join('\n  '));
}
console.log(failed ? `\n${failed} pair(s) fail` : '\nAll pairs pass WCAG AA');
process.exit(failed ? 1 : 0);
