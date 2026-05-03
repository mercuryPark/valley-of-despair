# valleyofdespair — Claude Code 작업 가이드

이 파일은 Claude Code가 매 작업 시작 시 자동으로 읽는 진입점이다. 짧고 명확하게 유지한다.

## 이 프로젝트가 무엇인가

FE 개발자가 실무에서 마주치는 핵심 4 도메인(렌더링·상태관리·성능·비동기/네트워크)을 선수→심화 학습 경로로 깊이 학습하고, 인접 BE/DB 기초까지 FE 시점에서 함께 정리하는 학습 플랫폼.

- **타겟**: FE 1~5년차
- **차별화**: 깊은 콘텐츠 + 본인 실무 경험(OfficeNEXT, IndexedDB·Web Worker 등) 녹임
- **MVP**: 학습 우선, 평가/AI 시뮬레이션은 v2~v3
- **플랫폼**: Next.js 16 + PWA 단일 (RN/Expo는 v2 이후)

## 항상 따를 원칙 (Hard Rules)

- 모든 응답은 **한국어**
- 모든 결정은 **battle-tested, 공식 문서 기반**으로
- 불확실하면 "모른다"고 말하기. 추측·환각 금지
- 작업 전 항상 **현재 단계 = ROADMAP.md의 어디**인지 확인
- 코드 변경 전 **CONVENTIONS.md** 확인
- 콘텐츠 작업 전 **CONTENT_SCHEMA.md** 확인
- 기능·라이브러리 추가 시 **STACK.md의 거부 목록** 위반 여부 확인
- 새로운 큰 결정 시 **DECISIONS/**에 ADR 추가

## 우선 읽을 문서

| 의문                         | 참조                     |
| ---------------------------- | ------------------------ |
| 컨셉·타겟·차별화·범위        | `docs/PRODUCT.md`        |
| 기술 스택·거부된 대안        | `docs/STACK.md`          |
| 일정·현재 단계·다음 작업     | `docs/ROADMAP.md`        |
| 코드 스타일·테스트·커밋 규칙 | `docs/CONVENTIONS.md`    |
| frontmatter·노드 작성 템플릿 | `docs/CONTENT_SCHEMA.md` |
| 과거 결정의 배경             | `docs/DECISIONS/*.md`    |

## 절대 하지 말 것 (안티패턴 가드레일)

이 목록은 우리가 명시적으로 거부한 결정이다. 새로 제안하지 말 것.

- ❌ React Native / Expo 코드 생성 (v2 이후)
- ❌ LLM API 통합 (v3)
- ❌ 평가·점수·랭킹 시스템 (v2)
- ❌ AI 시뮬레이션·대화형 시나리오 (v3)
- ❌ Three.js 기반 학습 트리 (랜딩 페이지 외 3D 금지)
- ❌ 게임 UI 스타일 선형 진행·클리어 게이팅 (자유 탐색이 핵심)
- ❌ localStorage / sessionStorage 사용 (Supabase progress 테이블 사용)
- ❌ CSS-in-JS 라이브러리 (Tailwind only)
- ❌ Notion API / 외부 CMS 연동 (MDX + Git만)
- ❌ Firebase 도입 (Supabase 결정)
- ❌ Pages Router 도입 (App Router만)
- ❌ Redux 도입 (Zustand만)
- ❌ axios·fetch 직접 (React Query + Supabase 클라이언트만)
- ❌ TDD 강요 (테스트는 구현 후 작성)
- ❌ "나중에 RN 추가" 전제로 한 사전 모노레포·디자인 토큰 분리 (YAGNI)

## 모델 티어링

- **Opus**: 기획·설계·리뷰·복잡한 디버깅
- **Sonnet**: 일반 코드 작성·리팩터·보일러플레이트

## 현재 진행 상황

- **단계**: 1주차 Day 5 (관측 + CI — Sentry/PostHog/GitHub Actions)
- **방금 완료**: Day 4 (MDX 파이프라인 골격 — `content/` + frontmatter Zod 스키마·`next-mdx-remote/rsc` 로더·`shiki` dual theme·`rehype-slug`/`autolink-headings`·임시 `/learn/preview` 검증)
- **prod URL**: https://valleyofdespair.vercel.app
- **주요 마일스톤**: 1~4주차 인프라 → 5~12주차 콘텐츠 → 13~14주차 랜딩 3D → 15주차 출시

상세는 `docs/ROADMAP.md` 참조.
