// End-to-end check on a phone-sized screen (390x844), light and dark.
// Builds nothing: run `npm run build` first. Usage: node scripts/e2e.mjs [screenshot dir]
// Fails on any page error, console error, or sideways overflow; plays a pass, a case and a review by tapping.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUT = process.argv[2] || 'e2e-shots';
mkdirSync(OUT, { recursive: true });
const PORT = 4329, ROOT = `http://localhost:${PORT}/validation/`;
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) { try { if ((await fetch(ROOT)).ok) break; } catch { /* not up yet */ } await wait(250); }

/* Saved progress in the v1/v2 format, as an existing user would have it. */
function seed() {
  const t = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000), dow = (t + 3) % 7;
  const hist = {}; for (let d = t - dow; d < t; d++) if ((d * 7) % 3) hist[d] = [8 + ((d * 13) % 20), (d % 3), d % 2];
  hist[t] = [12, 1, 1];
  const r = {}; ['jq-j-search-0', 'jq-j-search-1', 'jq-j-search-2', 'jq-j-search-3', 'jq-j-search-4', 'jq-j-search-5', 'jq-j-search-6', 'jq-j-rach-0', 'jq-j-rach-1', 'jq-j-rach-2']
    .forEach((id, i) => { r[id] = { b: i % 4 === 0 ? 0 : 1 + (i % 5), due: t + (i % 3) - 1, n: 3, m: i % 4 === 0 ? 2 : 0 }; });
  return { v: 1, j: { 'j-search': { lv: 3 }, 'j-rach': { lv: 1 } }, c: { 'c-forbidden': { best: 0.9, n: 2 }, 'c-rach-silent': { best: 0.62, n: 1 } }, r, day: { d: t, nw: 2, done: 12, jp: 1, cs: 0 }, streak: { last: t, n: 4, best: 9 }, set: { newPerDay: 10 }, lessons: { a1: 1, a2: 1, a3: 1, e1: 1, e2: 1, b1: 1 }, hist, updated: Date.now() };
}

const errors = [];
const browser = await chromium.launch();
async function page(scheme, seeded) {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: scheme, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  p.on('pageerror', (e) => errors.push(`${scheme} ${p.url()}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${scheme} ${p.url()} console: ${m.text()}`); });
  await p.goto(ROOT);
  await p.evaluate((s) => (s ? localStorage.setItem('ran-validation-v1', JSON.stringify(s)) : localStorage.clear()), seeded ? seed() : null);
  return p;
}
const routes = ['', 'journey/', 'journey/j-rach/', 'cases/', 'cases/c-rach-silent/', 'review/', 'library/', 'library/rrc/', 'library/rrc/e1/', 'library/terms/', 'search/?q=t310', 'settings/'];
for (const scheme of ['light', 'dark']) {
  const p = await page(scheme, true);
  for (const r of routes) {
    await p.goto(ROOT + r); await p.waitForTimeout(700);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 0) errors.push(`${scheme} ${r}: page scrolls sideways by ${over}px`);
    const small = await p.evaluate(() => [...document.querySelectorAll('main a, main button, nav a')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && b.height < 48 && getComputedStyle(e).display !== 'inline'; }).map((e) => e.textContent.trim().slice(0, 30)));
    if (small.length) errors.push(`${scheme} ${r}: tap targets under 48px: ${small.slice(0, 5).join(' | ')}`);
    await p.screenshot({ path: `${OUT}/${scheme}-${(r || 'today').replace(/[/?=]+/g, '_').replace(/_$/, '')}.png`, fullPage: true });
  }
  await p.close();
}
/* flows, fresh user, by tapping */
const p = await page('light', false);
await p.goto(ROOT + 'journey/j-search/'); await p.waitForTimeout(300);
await p.tap('[data-a=start][data-v="1"]');
for (let i = 0; i < 7; i++) { await p.tap('.opt >> nth=0'); await p.tap('[data-a=why]'); if (i === 0) await p.screenshot({ path: `${OUT}/flow-pass1.png`, fullPage: true }); await p.tap('[data-a=p1next]'); }
const passText = await p.textContent('#play h1');
await p.goto(ROOT + 'cases/c-rach-silent/'); await p.waitForTimeout(300);
await p.tap('.ln >> nth=0'); await p.tap('.ln >> nth=2');
await p.tap('.opt >> nth=0'); await p.screenshot({ path: `${OUT}/flow-case.png`, fullPage: true });
for (let i = 0; i < 12 && !(await p.$('.ready')); i++) { if (await p.$('[data-a=next]')) await p.tap('[data-a=next]'); else if (await p.$('.opt:not([disabled])')) await p.tap('.opt:not([disabled]) >> nth=0'); }
const verdict = await p.textContent('.ready .tag');
await p.goto(ROOT + 'review/'); await p.waitForTimeout(500);
await p.tap('[data-a=start]'); await p.tap('[data-a=show]'); await p.screenshot({ path: `${OUT}/flow-review.png`, fullPage: true });
for (let i = 0; i < 12; i++) { await p.tap(`[data-a=grade][data-v="${i % 3}"]`); if (await p.$('[data-a=show]')) await p.tap('[data-a=show]'); else break; }
const state = await p.evaluate(() => JSON.parse(localStorage.getItem('ran-validation-v1')));
await p.goto(ROOT); await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/flow-today-after.png`, fullPage: true });
console.log(`pass 1 end screen: "${passText}"; case verdict: ${verdict}; journey ${JSON.stringify(state.j)}; case ${JSON.stringify(state.c)}; review answered today ${state.day.done}, cards started ${Object.keys(state.r).length}`);
await browser.close(); server.kill();
console.log(errors.length ? `\n${errors.length} problem(s):\n` + errors.join('\n') : '\nNo errors, no sideways scrolling, all tap targets >= 48px.');
process.exit(errors.length ? 1 : 0);
