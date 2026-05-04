# STACK.md — 기술 스택과 거부된 대안

## 한 페이지 요약

| 영역                | 채택                                                        | 거부                                      |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| 프레임워크          | Next.js 16 (App Router)                                     | Pages Router, Remix, Vite SPA             |
| 언어                | TypeScript strict                                           | JavaScript                                |
| 콘텐츠 저장         | MDX + Git                                                   | Sanity, Contentlayer, Notion API, DB 직접 |
| DB·인증             | Supabase                                                    | Firebase, Clerk+Neon, NextAuth+직접 DB    |
| 상태 (클라이언트)   | Zustand                                                     | Redux, Jotai, Recoil, Context 남용        |
| 데이터 페칭         | React Query (`@tanstack/react-query`) + Supabase 클라이언트 | axios·fetch 직접, SWR                     |
| 스타일              | Tailwind v4 + shadcn/ui                                     | CSS-in-JS (styled-components, Emotion)    |
| 폼                  | React Hook Form + Zod                                       | Formik                                    |
| 검색                | Pagefind (빌드 타임)                                        | Algolia, Typesense, FlexSearch            |
| 호스팅              | Vercel                                                      | Cloudflare Pages, 자체 호스팅             |
| 관측                | Sentry + PostHog                                            | GA4 단독, Datadog                         |
| 트리 시각화         | 사이드바 (MVP) → React Flow 도메인 그래프 (v1.1)            | Three.js 트리, 자체 SVG                   |
| 랜딩 3D (v1 마지막) | react-three-fiber + drei                                    | Three.js raw, Babylon.js                  |
| 패키지 매니저       | pnpm                                                        | npm, yarn                                 |
| 코드 품질           | ESLint + Prettier + Husky + lint-staged                     | (생략 안 됨)                              |
| 테스트              | Vitest (구현 후 작성)                                       | Jest, TDD 워크플로                        |
| E2E                 | Playwright (v1.5+)                                          | Cypress                                   |
| 모바일 앱           | **MVP 없음**, v2+ 검토                                      | RN/Expo MVP 도입                          |

## 결정 근거 (요약, 상세는 DECISIONS/ 참조)

### Next.js 16 App Router

- **이유**: 학습 콘텐츠는 SSG/ISR 핏이 좋음. SEO 중요(검색 유입). MDX 생태계가 Next에 자연 정렬. App Router는 새 프로젝트의 기본.
- **트레이드오프**: RSC와 클라이언트 컴포넌트 경계 학습 곡선. 학습 사이트는 인터랙션이 많아 결국 `"use client"` 자주 등장.
- **거부**: Pages Router는 새 프로젝트에서 채택할 합리적 근거 없음. Vite SPA는 SSG/SEO 약함.

### MDX + Git

- **이유**: 본인이 유일 작성자, 버전 관리 무료, grep·검색 자유, Vercel 배포와 자연 통합, 빌드 타임 정적 처리.
- **트레이드오프**: 비개발자 작성 어려움 (해당 없음, 본인만 작성).
- **거부**:
  - Sanity/Contentlayer는 다중 작성자용 → 1인엔 오버엔지니어링.
  - Notion API는 rate limit·코드블록 변형·이미지 만료 빈번.
  - DB 직접 저장은 마크다운 에디터 자작 비용이 큼.

### Supabase

- **이유**: Postgres 관계형 → 진척도 같은 정형 데이터 적합. Auth + RLS zero-config. Google·GitHub OAuth 즉시. 무료 티어 (500MB DB, 50K MAU) 사이드 프로젝트 충분.
- **트레이드오프**: 한국 region 없음 (Tokyo 사용). 학습 사이트는 latency 민감도 낮아 OK.
- **거부**:
  - Firebase는 NoSQL이라 진척도 데이터엔 어색하고 vendor lock-in 강함.
  - Clerk+Neon은 더 매끄럽지만 비용·복잡도 큼. 1인엔 과함.
  - NextAuth + 직접 DB는 인증 직접 짜기 안티패턴.

### Tailwind v4 + shadcn/ui

- **이유**: 1인 개발 효율 최상. 컴포넌트 카피해서 수정. RSC와 호환 좋음.
- **트레이드오프**: 클래스 길이 길어짐 (Prettier 플러그인이 정렬).
- **거부**: CSS-in-JS는 RSC와 충돌 잦음 (서버 컴포넌트에서 사용 불가).

### Zustand

- **이유**: Hoyeon님 이미 익숙. 보일러플레이트 최소. RSC 환경에서 작동 확인됨.
- **거부**: Redux는 진척도·UI 상태에 과함. Jotai/Recoil은 현재 익숙도 낮음, MVP에 학습 비용 추가 안 함.

### React Query

- **이유**: Supabase 클라이언트 응답을 캐시·재시도·낙관적 업데이트로 다루는 표준 패턴.
- **거부**: 직접 `useEffect + fetch`는 동기화·로딩·에러 처리 직접 짜야 함, 안티패턴.

### Pagefind

- **이유**: 빌드 타임 인덱스 → 클라이언트 검색. zero infra. 100MB 이하 콘텐츠에 완벽. 한국어 지원.
- **거부**:
  - Algolia는 무료 티어 빠듯, 외부 의존.
  - Typesense self-hosted는 인프라 추가, 1인엔 과함.
  - FlexSearch는 한국어 토크나이징 약함.

### Vercel

- **이유**: Next.js 만든 회사. Hobby 티어 사이드 프로젝트 충분. ISR·Image Optimization·Edge Function 통합.
- **거부**: Cloudflare Pages는 가격 더 좋지만 App Router 최신 기능 호환 가끔 늦음.

### Sentry + PostHog

- **이유**: Sentry는 무료 티어 5K events/month로 에러 추적. PostHog는 무료 1M events로 product analytics·세션 리플레이.
- **거부**: GA4 단독은 에러 추적 불가, 한국 사용자 분석 부족.

### 시각화 단계적 도입

- **MVP**: 사이드바 트리 (3~5일)
- **v1.1**: 도메인별 React Flow 그래프 (1~2주)
- **랜딩 v1 마지막**: react-three-fiber 3D (1~2주)
- **거부**: 학습 트리 자체를 Three.js로 만드는 방향. 자유 탐색 파괴, SEO·접근성·성능·1인 개발 비용 모두 안티패턴.

## 도메인 분류 (콘텐츠)

| slug          | 한국어 라벨       | 범위                                       |
| ------------- | ----------------- | ------------------------------------------ |
| `foundations` | Web 기초          | HTML/CSS/HTTP, 브라우저 기본, 웹 표준      |
| `frontend`    | 프론트엔드        | 렌더링·상태·React/Vue·번들·클라이언트 성능 |
| `backend`     | 백엔드 (API 포함) | 서버·API 설계·REST/GraphQL·인증·인가       |
| `database`    | 데이터베이스      | 관계·NoSQL·트랜잭션·인덱스·정합성          |
| `cloud`       | 클라우드·DevOps   | AWS·CI/CD·인프라 기초·관측                 |
| `cs`          | 컴퓨터 과학       | 알고리즘·자료구조·OS·네트워크 기초         |

`src/lib/content/schema.ts`의 `DOMAINS`·`DOMAIN_META`가 단일 출처.

## 환경변수 표준 (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # 서버 전용, 클라이언트 노출 금지

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## 라이브러리 추가 의사결정 체크리스트

새 라이브러리 도입 전 다음을 모두 확인:

- [ ] 공식 문서가 잘 유지되는가
- [ ] 주간 다운로드 수 충분한가 (npm trends)
- [ ] 최근 6개월 내 커밋 활발한가
- [ ] TypeScript 타입 제공되는가 (또는 `@types/`)
- [ ] 번들 크기 영향 (bundlephobia 확인)
- [ ] 기존 채택 라이브러리로 해결 안 되는가
- [ ] STACK.md의 거부 목록에 없는가

하나라도 미달이면 도입 보류, 대안 검색.

## 안티패턴 명시 거부 목록

이 목록은 새 인스턴스가 다시 제안하지 않도록 박아둠.

- ❌ Notion API 콘텐츠 동기화
- ❌ Headless CMS (Sanity, Contentlayer, Strapi 등) 도입
- ❌ Firebase 도입
- ❌ NextAuth + 자체 DB 인증
- ❌ Redux / MobX 도입
- ❌ axios·fetch 직접 사용 (React Query + Supabase만)
- ❌ CSS-in-JS (styled-components, Emotion 등)
- ❌ Pages Router 신규 도입
- ❌ TDD 강요 (테스트는 구현 후)
- ❌ React Native / Expo MVP 도입
- ❌ LLM API 직접 호출
- ❌ Three.js 학습 트리
- ❌ localStorage / sessionStorage 사용 (Supabase progress 사용)
- ❌ GA4 단독 채택
- ❌ Webpack 직접 설정 (Next.js 기본 유지)
- ❌ Babel 커스텀 설정 (SWC 기본 유지)
- ❌ npm·yarn 사용 (pnpm 통일)
- ❌ 본인이 검수하지 않은 LLM 출력을 그대로 publish (status: draft → review → published 강제)
- ❌ 사이트 노드 분류를 FE 4 도메인으로 한정 (현재 6개 동등 도메인: foundations/frontend/backend/database/cloud/cs)
- ❌ "본인 실무 경험" 1인칭 콘텐츠 의무화 (큐레이션 모델로 전환)
