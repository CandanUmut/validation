// Search index: terms, lessons, journey steps, cases, facts. Built at build time, loaded on the search page.
import { chapters, cases, modules, lessons, terms, termCats, facts, caseCode, pad2 } from '../../lib/data';
import { u } from '../../lib/url';
const strip = (s: string) => s.replace(/<[^>]+>/g, '');
export async function GET() {
  const out: { g: string; t: string; s: string; x: string; h?: string; mono?: 1 }[] = [];
  const cats = await termCats(), mods = await modules();
  for (const t of await terms()) out.push({ g: 'Terms', t: t.term, s: t.meaning + ' · ' + (cats[t.category] ?? ''), x: (t.term + ' ' + t.meaning).toLowerCase(), h: u('library/terms/?q=' + encodeURIComponent(t.term)), mono: 1 });
  for (const l of await lessons()) { const m = mods.find((x) => x.id === l.module)!; out.push({ g: 'Lessons', t: l.title, s: m.title + ' · ' + strip(l.say || l.points[0] || ''), x: (l.title + ' ' + strip(l.points.join(' ')) + ' ' + strip(l.say || '')).toLowerCase(), h: u(`library/${l.module}/${l.id}/`) }); }
  for (const ch of await chapters()) ch.steps.forEach((s) => out.push({ g: 'Journey steps', t: s.message, s: `Ch ${pad2(ch.order)} · ${ch.title} · ${s.layer} · ${s.what}`, x: (s.message + ' ' + s.layer + ' ' + s.what + ' ' + s.why + ' ' + s.answer + ' ' + s.log).toLowerCase(), h: u(`journey/${ch.id}/`), mono: 1 }));
  for (const c of await cases()) out.push({ g: 'Cases', t: caseCode(c.order) + ' · ' + c.title, s: c.tag + ' · ' + c.brief, x: (c.title + ' ' + c.tag + ' ' + c.brief + ' ' + c.setup + ' ' + c.log.join(' ')).toLowerCase(), h: u(`cases/${c.id}/`) });
  for (const f of await facts()) out.push({ g: 'Facts', t: f.question, s: f.answer, x: (f.question + ' ' + f.answer).toLowerCase() });
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
}
