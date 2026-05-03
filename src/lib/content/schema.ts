import { z } from 'zod';

export const DOMAINS = [
  'rendering',
  'state',
  'performance',
  'async',
  'side-http',
  'side-auth',
  'side-db',
  'side-server',
] as const;

export type Domain = (typeof DOMAINS)[number];

export const FrontmatterSchema = z.object({
  id: z.string().regex(/^[a-z]+(-[a-z0-9]+)*$/, 'kebab-case 필수'),
  title: z.string().min(1),
  domain: z.enum(DOMAINS),
  order: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string()),
  crossLinks: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'published']),
  updatedAt: z.preprocess(
    (val) => (val instanceof Date ? val.toISOString().slice(0, 10) : val),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식 필수'),
  ),
  summary: z.string().min(10),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;
