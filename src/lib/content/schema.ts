import { z } from 'zod';

export const DOMAINS = [
  'foundations',
  'frontend',
  'backend',
  'database',
  'cloud',
  'cs',
] as const;

export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_META: Record<Domain, { label: string; description: string }> = {
  foundations: {
    label: 'Web 기초',
    description: 'HTML/CSS/HTTP, 브라우저 기본, 웹 표준.',
  },
  frontend: {
    label: '프론트엔드',
    description: '렌더링·상태·React/Vue·번들·클라이언트 성능.',
  },
  backend: {
    label: '백엔드 (API 포함)',
    description: '서버·API 설계·REST/GraphQL·인증·인가.',
  },
  database: {
    label: '데이터베이스',
    description: '관계·NoSQL·트랜잭션·인덱스·정합성.',
  },
  cloud: {
    label: '클라우드·DevOps',
    description: 'AWS·CI/CD·인프라 기초·관측.',
  },
  cs: {
    label: '컴퓨터 과학',
    description: '알고리즘·자료구조·OS·네트워크 기초.',
  },
};

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
