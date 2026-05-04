# ROADMAP.md — 15주 일정

## 가정

- **풀타임** (하루 8시간+ 투입 가능)
- 직장 병행 시 1.5~2배 (약 6~8개월)

## 마일스톤 한눈에

| 주차  | 단계                      | 산출물                                                          |
| ----- | ------------------------- | --------------------------------------------------------------- |
| 1     | 인프라 셋업               | 빈 Next.js 앱 + Vercel 배포 + Supabase 연결 + 관측 도구         |
| 2     | 콘텐츠 파이프라인         | MDX 렌더, frontmatter 스키마, 노드 페이지 라우팅, 더미 노드 5개 |
| 3     | 사이드바 트리 + 진척도    | 인증·RLS·진척도 토글·트리 네비                                  |
| 4     | 검색 + 노드 페이지 마감   | Pagefind, 코드 하이라이팅, 헤더 앵커, 다크/라이트               |
| 5~12  | 콘텐츠 작성 (자유 페이스) | 더미 6 → MVP 30~40 → 장기 60~80 (도메인당 5~13)                 |
| 13~14 | 랜딩 3D                   | react-three-fiber, GLB 통합, 모바일 fallback                    |
| 15    | QA + 폴리싱 + 배포        | Lighthouse, 스모크 테스트, 도메인 연결, 출시                    |

---

## 1주차: 인프라 셋업

### Day 1 (완료) — 환경 셋업

- [x] pnpm 프로젝트 생성 (Next.js 16 + TS + Tailwind + App Router)
- [x] TypeScript strict 강화 (noUncheckedIndexedAccess 등)
- [x] ESLint + Prettier (prettier-plugin-tailwindcss)
- [x] Husky + lint-staged
- [x] GitHub 레포 (public, build-in-public — ADR 0009) + main 보호
- [x] Vercel 연동 (자동 배포 + PR preview)

**완료 기준**: 빈 페이지가 `https://valleyofdespair.vercel.app`에서 보임 ✓

### Day 2 (완료) — 디자인 시스템 + shadcn/ui

- [x] Tailwind v4 디자인 토큰 정의 (Valley OKLCH stone + amber, `:root`/`.dark`)
- [x] 다크/라이트 모드 (`next-themes`, dark default + 수동 토글)
- [x] shadcn/ui 초기 컴포넌트 (Button, Card, Sheet, Skeleton, Sidebar) + new-york style
- [x] 글로벌 레이아웃 (Header + Sidebar 슬롯 + Main + Footer)
- [x] Crimson Pro 헤딩 serif (`next/font/google` self-host)

### Day 3 (완료) — Supabase 통합

- [x] Supabase 프로젝트 생성, env 변수 (.env.local + Vercel prod/preview/dev)
- [x] Auth 설정 (Google + GitHub OAuth, Site URL + Redirect URLs)
- [x] `progress` 테이블 + RLS 정책 (`supabase/migrations/0001_progress.sql`)
- [x] `@supabase/ssr` 클라이언트·서버 헬퍼 분리 (`src/lib/supabase/{client,server,middleware}.ts`)
- [x] 로그인/로그아웃 플로 (`/auth/sign-in`, `/auth/callback`, `/auth/sign-out`, 헤더 AuthButton)
- [x] Next 16 `proxy.ts` (구 middleware) 세션 갱신

### Day 4 (완료) — 콘텐츠 파이프라인 골격

- [x] `content/` 디렉토리 구조 (`content/rendering/01-html-parsing.mdx`)
- [x] frontmatter Zod 스키마 (`src/lib/content/schema.ts`, gray-matter Date → string preprocess)
- [x] `next-mdx-remote/rsc` 로더 (`src/lib/content/{loader,mdx}.ts`)
- [x] `shiki` + `rehype-pretty-code` (github-light/github-dark dual theme)
- [x] `rehype-slug` + `rehype-autolink-headings` (wrap behavior, `heading-anchor` 클래스)
- [x] 더미 노드 1개 렌더 확인 (임시 `/learn/preview` — 본 라우팅은 2주차)

### Day 5 (완료) — 관측 + CI

- [x] Sentry 통합 (`@sentry/nextjs` 10.x — `instrumentation.ts` 서버/엣지 + `instrumentation-client.ts` + `global-error.tsx`, `withSentryConfig` source map 업로드, `/monitoring` 터널)
- [x] PostHog 통합 (`posthog-js` lazy init + App Router `$pageview` 캡처 + Supabase `onAuthStateChange`로 identify/reset)
- [x] GitHub Actions `ci.yml` (pnpm + Node 20, typecheck · lint · build)
- [x] Vercel prod 배포 검증 (PostHog `$pageview`/identify 도착, Sentry `/monitoring` POST 200, source map 매핑)

**1주차 완료 기준**: 빈 콘텐츠 셸이 prod에 배포됨 ✓, 인증 작동 ✓, 더미 노드 1개 렌더 ✓, 관측 작동 ✓

---

## 2주차: 콘텐츠 파이프라인

- [ ] frontmatter Zod 검증 + 빌드 실패 처리
- [ ] 노드 페이지 라우팅 (`/learn/[domain]/[slug]`)
- [ ] 도메인 인덱스 페이지 (`/learn/[domain]`)
- [ ] 노드 본문 렌더링 (제목·메타·본문·다음 노드 링크)
- [ ] 더미 노드 6개 작성 — 6개 동등 도메인 각 1개씩 (피벗 반영, foundations/frontend/backend/database/cloud/cs)
- [ ] 콘텐츠 빌드 시 자동 검증 스크립트

**완료 기준**: 더미 노드 6개(도메인당 1)가 prod에 배포되어 정상 렌더

---

## 3주차: 사이드바 트리 + 진척도

- [ ] 사이드바 컴포넌트 (도메인 그룹 + 노드 목록 + 진척도 표시)
- [ ] 모바일 햄버거 메뉴 (Sheet)
- [ ] 키보드 네비 (Tab, 화살표)
- [ ] 진척도 토글 (`unread / reading / completed`)
- [ ] React Query로 진척도 동기화 (낙관적 업데이트)
- [ ] 인증 안 된 상태 처리 (진척도는 로컬 미사용, 로그인 유도)

**완료 기준**: 로그인 후 진척도 표시·토글이 사이드바에 즉시 반영

---

## 4주차: 검색 + 노드 페이지 마감

- [ ] Pagefind 빌드 통합 (postbuild 스크립트)
- [ ] 검색 UI (Cmd+K 단축키, shadcn Command 컴포넌트)
- [ ] 검색 결과 → 노드 페이지 이동
- [ ] 코드 블록 복사 버튼
- [ ] 헤더 앵커 + 목차 (TOC, 우측)
- [ ] 다음/이전 노드 네비
- [ ] 다크/라이트 일관성 검증
- [ ] PWA 매니페스트 + 오프라인 캐싱 (next-pwa 또는 Workbox)

**완료 기준**: 사용자가 로그인 → 검색 → 노드 → 진척도 토글까지 전 흐름 가능

---

## 5~12주차: 콘텐츠 작성 (자유 페이스)

피벗 후 ROADMAP은 "8주 풀타임 콘텐츠"에서 "본인 페이스로 30~40 도달 시 MVP 출시"로 변경. 우선순위: 인프라 모두 마감 → 콘텐츠.

### 단계별 목표

| 단계        | 노드 수        | 도메인당 | 출시 가능성           |
| ----------- | -------------- | -------- | --------------------- |
| 더미 (지금) | 6 (도메인당 1) | 1        | ❌ 인프라 검증용      |
| MVP 출시    | 30~40          | 5~7      | ✅ 커뮤니티 공개 가능 |
| 장기        | 60~80          | 10~13    | ✅ 도메인 깊이 균형   |

### 작성 순서 (권장)

콘텐츠 4 기둥(연결·쉬움·실무·검증) 모두 갖춘 노드 우선. 도메인 순서 권장:

1. foundations (Web 기초) — 다른 도메인 prereq 자주 됨
2. frontend / backend (자연스러운 연결 다수)
3. database (frontend·backend cross-link 풍부)
4. cs (foundations·frontend·backend 모두에서 prereq)
5. cloud (다른 도메인 노드 어느 정도 쌓인 뒤)

### 작성 워크플로 (큐레이션 모드, 노드당 약 1.5~2시간)

`docs/CONTENT_SCHEMA.md`의 "노드 작성 워크플로" 참조. 본인 실무 경험 1인칭은 0%, 큐레이션 50/40/10 비중.

### 운영 원칙

- 한 노드에서 1시간 이상 막히면 `status: draft`로 두고 다음으로 이동
- 매월 1일 진척도 점검 (월 5~8 노드 안 나오면 도메인 우선순위 재검토)
- `status: draft → review → published` 강제. review 단계에서 1주 cool-down 권장

---

## 13~14주차: 랜딩 3D

- [ ] react-three-fiber + drei 설치
- [ ] GLB 모델 선정 (Sketchfab CC0 / Poly Pizza, 협곡·나무 모티프)
- [ ] Draco 압축, 2MB 이하
- [ ] 랜딩 페이지 통합 (스크롤 인터랙션 미세하게)
- [ ] 모바일 분기 (3D 끄고 정적 이미지)
- [ ] iOS Safari WebGL 검증
- [ ] LCP < 2.5s 유지 검증

**완료 기준**: 랜딩 첫인상 임팩트 + 모바일 가벼운 fallback

---

## 15주차: QA + 폴리싱 + 배포

- [ ] Playwright 스모크 테스트 (로그인, 노드 진입, 진척도 토글, 검색)
- [ ] Lighthouse: Performance ≥ 90, A11y ≥ 95, SEO 100
- [ ] 메타 태그·OG 이미지·sitemap.xml·robots.txt
- [ ] 도메인 연결 (`valleyofdespair.com`)
- [ ] Sentry 알림 채널 설정
- [ ] PostHog 이벤트 검증
- [ ] 출시 공지 (개발자 커뮤니티 — 선택)

---

## v1.1 이후 (출시 후)

- 도메인별 React Flow 그래프 도입
- 노드 단위 간단 퀴즈 (CS 영역에 한해)
- 북마크
- 학습 노트
- 학습 통계

이 항목들은 사용자 피드백 보고 우선순위 재정렬.

## 일정 위험 신호

다음 중 하나라도 발생 시 일정·범위 재협상:

- 1주차에 기본 인프라 안 끝남 → 2주차로 연장, 콘텐츠 8주 유지 강제
- 인프라 마감 후 첫 30일 내 노드 12개 못 채움 → 큐레이션 워크플로 재검토 (외부 자료·LLM 비중 ↑)
- 60일 내 도메인 6개 모두 평균 5 노드 못 채움 → 도메인 2개로 압축 후 출시 (보강은 출시 후)
- 90일 내 콘텐츠 30개 미만 → 출시 미루고 콘텐츠 우선 (랜딩 3D 포기 검토)
