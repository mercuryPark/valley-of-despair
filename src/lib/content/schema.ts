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

export const DOMAIN_META: Record<Domain, { label: string; description: string }> = {
  rendering: {
    label: '렌더링',
    description: '브라우저가 HTML·CSS·JS를 받아 픽셀로 만드는 파이프라인.',
  },
  state: {
    label: '상태 관리',
    description: '클라이언트 상태와 서버 상태의 분리, 동기화 전략.',
  },
  performance: {
    label: '성능',
    description: '측정 가능한 지표 위주의 최적화 — 로딩·런타임·메모리.',
  },
  async: {
    label: '비동기·네트워크',
    description: 'Promise·이벤트 루프부터 캐싱·재시도까지.',
  },
  'side-http': {
    label: 'HTTP 기초',
    description: 'FE 시점에서 알아야 할 HTTP·CORS·캐시·쿠키.',
  },
  'side-auth': {
    label: '인증·인가 기초',
    description: '세션·JWT·OAuth — 토큰 저장·갱신·재발급.',
  },
  'side-db': {
    label: '데이터베이스 기초',
    description: 'FE에서 자주 부딪히는 트랜잭션·인덱스·정합성.',
  },
  'side-server': {
    label: '서버 기초',
    description: 'BFF·SSR·엣지·서버리스 — FE가 먼저 알면 좋은 서버 측면.',
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
