// Typed content model. A wrong field in any content file fails the build.
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const id = z.string().regex(/^[a-z0-9-]+$/);
/** A spec reference behind a lesson. `checked` only when the section text itself was read. */
const spec = z.object({ ref: z.string(), title: z.string(), release: z.string().optional(), status: z.enum(['checked', 'check']) });

const modules = defineCollection({
  loader: file('src/content/modules.yaml'),
  schema: z.object({ id, code: z.string().max(4), order: z.number().int(), title: z.string(), summary: z.string() }),
});
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons', generateId: ({ data }) => String(data.id) }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9]+$/),
    module: id,
    order: z.number().int(),
    title: z.string(),
    /** v1 = written from general knowledge, not yet checked against the specs. research = written from docs/research. */
    source: z.enum(['v1', 'research']),
    points: z.array(z.string()).default([]),
    say: z.string().optional(),
    trap: z.string().optional(),
    specs: z.array(spec).default([]),
  }),
});
const layer = z.enum(['PHY', 'MAC', 'RLC', 'PDCP', 'SDAP', 'RRC', 'NAS', 'S1AP', 'X2AP', 'NGAP', 'XnAP', 'F1AP']);
const journey = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/journey', generateId: ({ data }) => String(data.id) }),
  schema: z.object({
    id, order: z.number().int(), title: z.string(), summary: z.string(), lanes: z.array(z.string()).min(2).max(4),
    steps: z.array(z.object({ from: z.number().int().min(0), to: z.number().int().min(0), message: z.string(), layer, what: z.string(), log: z.string(), why: z.string(), answer: z.string() })).min(3),
  }),
});
const cases = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/cases', generateId: ({ data }) => String(data.id) }),
  schema: z.object({
    id, order: z.number().int(), title: z.string(), tag: z.string(), brief: z.string(), setup: z.string(), log: z.array(z.string()).min(1),
    decisions: z.array(z.object({ question: z.string(), options: z.array(z.object({ text: z.string(), score: z.union([z.literal(0), z.literal(1), z.literal(2)]), feedback: z.string() })).min(2) })).min(1),
    cause: z.object({ question: z.string(), options: z.array(z.string()).min(2), answer: z.number().int().min(0), feedback: z.string() }),
    bug: z.string(), learn: z.array(z.string()).min(1),
  }),
});
const facts = defineCollection({ loader: file('src/content/facts.yaml'), schema: z.object({ id: z.string(), question: z.string(), answer: z.string(), group: z.string() }) });
const termCategories = defineCollection({ loader: file('src/content/term-categories.yaml'), schema: z.object({ id, name: z.string() }) });
const terms = defineCollection({ loader: file('src/content/terms.yaml'), schema: z.object({ id: z.string(), term: z.string(), category: id, meaning: z.string() }) });

export const collections = { modules, lessons, journey, cases, facts, termCategories, terms };
