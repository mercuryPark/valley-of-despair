# ROADMAP.md — 15주 일정

## 가정

- **풀타임** (하루 8시간+ 투입 가능)
- 직장 병행 시 1.5~2배 (약 6~8개월)

## 마일스톤 한눈에

| 주차  | 단계                    | 산출물                                                          |
| ----- | ----------------------- | --------------------------------------------------------------- |
| 1     | 인프라 셋업             | 빈 Next.js 앱 + Vercel 배포 + Supabase 연결 + 관측 도구         |
| 2     | 콘텐츠 파이프라인       | MDX 렌더, frontmatter 스키마, 노드 페이지 라우팅, 더미 노드 5개 |
| 3     | 사이드바 트리 + 진척도  | 인증·RLS·진척도 토글·트리 네비                                  |
| 4     | 검색 + 노드 페이지 마감 | Pagefind, 코드 하이라이팅, 헤더 앵커, 다크/라이트               |
| 5~12  | 콘텐츠 작성 (8주)       | 메인 60~80 + 보조 20~40 = 80~120 노드                           |
| 13~14 | 랜딩 3D                 | react-three-fiber, GLB 통합, 모바일 fallback                    |
| 15    | QA + 폴리싱 + 배포      | Lighthouse, 스모크 테스트, 도메인 연결, 출시                    |

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

### Day 4 — 콘텐츠 파이프라인 골격

- [ ] `content/` 디렉토리 구조
- [ ] frontmatter Zod 스키마 (CONTENT_SCHEMA.md 참조)
- [ ] `next-mdx-remote` 설정
- [ ] `shiki` + `rehype-pretty-code` 코드 하이라이팅
- [ ] `rehype-slug` + `rehype-autolink-headings`
- [ ] 더미 노드 1개 렌더 확인

### Day 5 — 관측 + CI

- [ ] Sentry 통합 (서버·클라이언트 + source map)
- [ ] PostHog 통합 (page view + identify)
- [ ] GitHub Actions: typecheck + lint + build
- [ ] Vercel preview 배포 검증

**1주차 완료 기준**: 빈 콘텐츠 셸이 prod에 배포됨, 인증 작동, 더미 노드 1개 렌더, 관측 작동

---

## 2주차: 콘텐츠 파이프라인

- [ ] frontmatter Zod 검증 + 빌드 실패 처리
- [ ] 노드 페이지 라우팅 (`/learn/[domain]/[slug]`)
- [ ] 도메인 인덱스 페이지 (`/learn/[domain]`)
- [ ] 노드 본문 렌더링 (제목·메타·본문·다음 노드 링크)
- [ ] 더미 노드 5개 작성 (각 도메인 1개씩 + 보조 1개)
- [ ] 콘텐츠 빌드 시 자동 검증 스크립트

**완료 기준**: 더미 노드 5개가 prod에 배포되어 정상 렌더

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

## 5~12주차: 콘텐츠 작성 (8주)

이 8주가 일정의 가장 큰 변수. 매주 10~15 노드 페이스 유지.

### 작성 순서 (권장)

1. **5~6주차**: 렌더링 도메인 (15~20 노드)
2. **7~8주차**: 상태관리 도메인 (15~20 노드)
3. **9~10주차**: 성능 도메인 (15~20 노드)
4. **11~12주차**: 비동기/네트워크 도메인 + 보조 영역 일부

### 작성 워크플로 (노드당 약 4시간)

1. 외부 자료 1차 출처 정리 (30분)
2. LLM에 구조 초안 요청 (15분)
3. 본인 경험·실무 포인트 작성 (1.5~2시간)
4. 코드 예시·다이어그램 (45분)
5. 검수·교정 (30분)

### 운영 원칙

- **메인 도메인 완성 전 보조 영역 안 건드림** (우선순위 명확)
- 한 노드에서 1시간 이상 막히면 `status: draft`로 두고 다음으로 이동
- 매주 일요일 진척도 점검 (10~15 노드 안 나오면 범위 재검토)

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
- 5주차에 첫 도메인 5 노드 못 채움 → 노드 작성 워크플로 재검토 (외부 자료 합성 비중 ↑)
- 9주차에 도메인 2개 못 끝남 → 보조 영역 제외, 메인만 유지
- 13주차에 콘텐츠 50% 미만 → 출시 미루고 콘텐츠 우선 (3D 포기 검토)
