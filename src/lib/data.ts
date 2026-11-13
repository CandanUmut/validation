// Build-time access to content, sorted, plus the review deck.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Chapter = CollectionEntry<'journey'>['data'];
export type Case = CollectionEntry<'cases'>['data'];
export type Lesson = CollectionEntry<'lessons'>['data'];
export type Module = CollectionEntry<'modules'>['data'];

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;
export const chapters = async () => (await getCollection('journey')).map((e) => e.data).sort(byOrder);
export const cases = async () => (await getCollection('cases')).map((e) => e.data).sort(byOrder);
export const modules = async () => (await getCollection('modules')).map((e) => e.data).sort(byOrder);
export const lessons = async () => (await getCollection('lessons')).map((e) => e.data);
export const lessonsOf = async (mod: string) => (await lessons()).filter((l) => l.module === mod).sort(byOrder);
export const terms = async () => (await getCollection('terms')).map((e) => e.data);
export const termCats = async () => Object.fromEntries((await getCollection('termCategories')).map((e) => [e.data.id, e.data.name]));
export const facts = async () => (await getCollection('facts')).map((e) => e.data);

/** One review card. ids are unchanged since v1 so review progress carries over. pr = order for new cards. */
export type Card = { id: string; f: string; b: string; g: string; ch?: string; pr: 0 | 1 | 2; term?: true };
export async function deck(): Promise<Card[]> {
  const out: Card[] = [];
  (await chapters()).forEach((ch) => ch.steps.forEach((s, i) => out.push({ id: `jq-${ch.id}-${i}`, f: s.why, b: s.answer, g: ch.title, ch: ch.id, pr: 0 })));
  (await facts()).forEach((f) => out.push({ id: f.id, f: f.question, b: f.answer, g: f.group, pr: 1 }));
  const cats = await termCats();
  (await terms()).forEach((t) => out.push({ id: t.id, f: t.term, b: t.meaning, g: cats[t.category] ?? t.category, pr: 2, term: true }));
  return out;
}

export const caseCode = (order: number) => 'RAN-' + String(order).padStart(3, '0');
export const pad2 = (n: number) => String(n).padStart(2, '0');
