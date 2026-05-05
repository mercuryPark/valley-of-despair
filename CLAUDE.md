# valleyofdespair — Claude Code 작업 가이드

이 파일은 Claude Code가 매 작업 시작 시 자동으로 읽는 진입점이다. 짧고 명확하게 유지한다.

## 이 프로젝트가 무엇인가

Dunning–Kruger 절망의 골짜기에 있는 2~5년차 개발자가 분야별로 끊어져 있던 지식을 실무 기반 예시로 연결하며 쉽게 학습하고, 자가 점검으로 이해도를 확인하면서 자신감을 회복할 수 있는 학습 노트형 플랫폼.

- **타겟**: 2~5년차 개발자 (FE/BE/풀스택/데브옵스 등 직군 불문). 1차 사용자는 본인.
- **도메인 6개 (동등)**: foundations / frontend / backend / database / cloud / cs
- **차별화 4 기둥 (모두 동등)**: 분야 간 연결 / 쉬운 설명 / 실무 시나리오 / 자가 점검
- **콘텐츠 합성**: 외부 자료 50% + LLM 보조 40% + 본인 큐레이션 10% (1인칭 실무 경험 0%)
- **MVP 출시 기준**: 30~40 노드. 평가/AI 시뮬레이션은 v2~v3
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
- ❌ "본인 실무 경험"을 노드 본문에 1인칭으로 녹이기 (큐레이션 모델로 전환됨)
- ❌ 본인이 검수하지 않은 LLM 출력을 `status: published`로 바로 박기 (draft → review → published 강제)
- ❌ "분야 간 연결" 섹션을 억지로 채우기 (진짜 연결 있을 때만)
- ❌ 한 노드에서 6개 도메인 동시 다루기 (한 노드 = 한 핵심 개념)

## 모델 티어링

- **Opus**: 기획·설계·리뷰·복잡한 디버깅
- **Sonnet**: 일반 코드 작성·리팩터·보일러플레이트

## 현재 진행 상황

- **단계**: 4주차 진입 직전 — 사이드바 + 진척도 완료
- **방금 완료**: 3주차 사이드바 트리 + 진척도(`docs/superpowers/specs/2026-05-05-sidebar-progress-design.md`)
- **prod URL**: https://valleyofdespair.vercel.app
- **주요 마일스톤**: 1~4주차 인프라 → 더미 콘텐츠 → 13~14주차 랜딩 3D → 15주차 출시 (콘텐츠는 자유 페이스, 30~40 도달 시 MVP 출시)

상세는 `docs/ROADMAP.md` 참조.
