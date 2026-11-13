// One-time port of the v1 content (js/data-*.js) into Astro content files, then a strict
// read-back check: every field written must equal the original exactly. Kept for the record.
// Usage: node scripts/port-content.mjs <dir with the v1 data-*.js files>
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import YAML from 'yaml';
import assert from 'node:assert/strict';

const src = process.argv[2];
if (!src) throw new Error('give the folder with the v1 data-*.js files');
const code = ['data-journey.js', 'data-cases.js', 'data-cards.js', 'data-library.js'].map((f) => readFileSync(path.join(src, f), 'utf8')).join('\n');
const v1 = vm.runInNewContext(code + '\n;({JOURNEY, CASES, FACTS, LEARN, TERMS, TERM_CATS})');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const out = 'src/content';
const y = (o) => YAML.stringify(o, { lineWidth: 0 });
const pad = (n) => String(n).padStart(2, '0');

/* modules and lessons */
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/modules.yaml`, '# Library modules, in order. Lessons live in lessons/<module id>/.\n' + y(v1.LEARN.map((m, i) => ({ id: m.id, order: i + 1, title: m.t, summary: m.s }))));
for (const m of v1.LEARN) {
  mkdirSync(`${out}/lessons/${m.id}`, { recursive: true });
  m.lessons.forEach((l, i) => {
    const fm = { id: l.id, module: m.id, order: i + 1, title: l.t, source: 'v1', points: l.p };
    if (l.say !== undefined) fm.say = l.say;
    if (l.trap !== undefined) fm.trap = l.trap;
    writeFileSync(`${out}/lessons/${m.id}/${pad(i + 1)}-${l.id}.md`, '---\n' + y(fm) + '---\n');
  });
}
/* journey */
mkdirSync(`${out}/journey`, { recursive: true });
v1.JOURNEY.forEach((ch, i) => writeFileSync(`${out}/journey/${pad(i + 1)}-${ch.id}.yaml`, y({ id: ch.id, order: i + 1, title: ch.t, summary: ch.s, lanes: ch.lanes,
  steps: ch.steps.map((s) => ({ from: s.f, to: s.t, message: s.m, layer: s.l, what: s.d, log: s.log, why: s.q, answer: s.a })) })));
/* cases */
mkdirSync(`${out}/cases`, { recursive: true });
v1.CASES.forEach((c, i) => writeFileSync(`${out}/cases/${pad(i + 1)}-${c.id}.yaml`, y({ id: c.id, order: i + 1, title: c.t, tag: c.tag, brief: c.brief, setup: c.setup, log: c.log,
  decisions: c.nodes.map((n) => ({ question: n.q, options: n.o.map((o) => ({ text: o[0], score: o[1], feedback: o[2] })) })),
  cause: { question: c.cause.q, options: c.cause.o, answer: c.cause.a, feedback: c.cause.fb }, bug: c.bug, learn: c.learn })));
/* facts, terms */
writeFileSync(`${out}/facts.yaml`, '# Review cards for numbers and facts. id keeps v1 review progress.\n' + y(v1.FACTS.map((f) => ({ id: 'f-' + slug(f[0]).slice(0, 48), question: f[0], answer: f[1], group: f[2] }))));
writeFileSync(`${out}/term-categories.yaml`, y(Object.entries(v1.TERM_CATS).map(([id, name]) => ({ id, name }))));
writeFileSync(`${out}/terms.yaml`, '# Glossary. id keeps v1 review progress.\n' + y(v1.TERMS.map((t) => ({ id: 't-' + slug(t[0]), term: t[0], category: t[1], meaning: t[2] }))));

/* ---- read back and compare with the original, field by field ---- */
const rd = (f) => YAML.parse(readFileSync(f, 'utf8'));
const fmOf = (f) => YAML.parse(readFileSync(f, 'utf8').split('---\n')[1]);
const mods = rd(`${out}/modules.yaml`);
const LEARN = mods.map((m) => ({ id: m.id, t: m.title, s: m.summary, lessons: readdirSync(`${out}/lessons/${m.id}`).sort().map((f) => fmOf(`${out}/lessons/${m.id}/${f}`)).map((l) => { const o = { id: l.id, t: l.title, p: l.points }; if (l.say !== undefined) o.say = l.say; if (l.trap !== undefined) o.trap = l.trap; return o; }) }));
assert.deepEqual(LEARN, JSON.parse(JSON.stringify(v1.LEARN)));
const JOURNEY = readdirSync(`${out}/journey`).sort().map((f) => rd(`${out}/journey/${f}`)).map((c) => ({ id: c.id, t: c.title, s: c.summary, lanes: c.lanes, steps: c.steps.map((s) => ({ f: s.from, t: s.to, m: s.message, l: s.layer, d: s.what, log: s.log, q: s.why, a: s.answer })) }));
assert.deepEqual(JOURNEY, JSON.parse(JSON.stringify(v1.JOURNEY)));
const CASES = readdirSync(`${out}/cases`).sort().map((f) => rd(`${out}/cases/${f}`)).map((c) => ({ id: c.id, t: c.title, tag: c.tag, brief: c.brief, setup: c.setup, log: c.log, nodes: c.decisions.map((n) => ({ q: n.question, o: n.options.map((o) => [o.text, o.score, o.feedback]) })), cause: { q: c.cause.question, o: c.cause.options, a: c.cause.answer, fb: c.cause.feedback }, bug: c.bug, learn: c.learn }));
assert.deepEqual(CASES, JSON.parse(JSON.stringify(v1.CASES)));
assert.deepEqual(rd(`${out}/facts.yaml`).map((f) => [f.question, f.answer, f.group]), JSON.parse(JSON.stringify(v1.FACTS)));
assert.deepEqual(rd(`${out}/terms.yaml`).map((t) => [t.term, t.category, t.meaning]), JSON.parse(JSON.stringify(v1.TERMS)));
assert.deepEqual(Object.fromEntries(rd(`${out}/term-categories.yaml`).map((c) => [c.id, c.name])), JSON.parse(JSON.stringify(v1.TERM_CATS)));
const ids = [...rd(`${out}/facts.yaml`).map((f) => f.id), ...rd(`${out}/terms.yaml`).map((t) => t.id)];
assert.equal(new Set(ids).size, ids.length, 'card ids must be unique');
console.log(`ported and verified: ${LEARN.length} modules, ${LEARN.flatMap((m) => m.lessons).length} lessons, ${JOURNEY.length} chapters, ${JOURNEY.flatMap((c) => c.steps).length} steps, ${CASES.length} cases, ${v1.FACTS.length} facts, ${v1.TERMS.length} terms. Every field matches v1 exactly.`);
