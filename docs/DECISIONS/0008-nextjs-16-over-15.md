# 0008. Next.js 16 채택 (15 → 16 상향)

- **Status**: Accepted
- **Date**: 2026-05-03

## Context

기획·로드맵 단계에서 STACK.md/CLAUDE.md/ROADMAP.md는 "Next.js 15 (App Router)"를 채택 명시. 하지만 Day 1 실행 시점(2026-05-03)에 `pnpm create next-app@latest --yes` 가 stable 16.2.4를 설치. 두 가지 길:

1. 명시한 대로 15.x로 다운그레이드(`pnpm create next-app@~15`)
2. 16.x 그대로 채택 + 문서 업데이트

## Decision

**16.x 그대로 채택.** STACK.md, CLAUDE.md, ROADMAP.md를 16으로 일괄 갱신.

## Consequences

### 긍정

- **이미 stable**: 16.2.4가 latest stable (May 2026). LTS 흐름과 정렬.
- **scaffold가 만든 `AGENTS.md` 활용**: Next 16부터 create-next-app이 `AGENTS.md`를 자동 추가. "Read the relevant guide in `node_modules/next/dist/docs/` before writing any code"라고 LLM 가이드를 명시 — 16의 breaking changes를 LLM이 정확히 다룰 단서가 항상 함께 옴.
- **학습 콘텐츠 가치**: 사이트 자체가 FE 학습 플랫폼. Next 16 기준으로 작성하면 출시 시점에도 더 오래 유효.
- **다운그레이드 비용 회피**: scaffold 재생성·PR 재작성 비용 없음.

### 부정

- **breaking changes**: 16은 15에서 일부 API/관례 변경. AGENTS.md가 *내 훈련 데이터에 없는 변경이 있다*고 명시. 코드 작성 시 매번 `node_modules/next/dist/docs/` 확인 필요.
- **외부 자료 시차**: 블로그·강의 다수가 아직 15 기준일 수 있음. 콘텐츠 작성 시 16-specific 내용은 1차 자료(공식 문서) 우선.
- **사이드 효과 미관측**: scaffold 직후라 실제 코드 깊이의 호환 이슈는 추후 확인 필요. 발견 시 본 ADR에 보강.

## 거부된 대안

### Next.js 15.x 다운그레이드

- 원래 명시는 15였지만, 명시한 이유는 "당시 latest stable"일 뿐. 본질적 의존이 아님.
- 다운그레이드는 scaffold 폐기·PR 재작성 비용. 배운 게 없는 작업.
- 15는 곧 LTS 흐름에서 outdated. 학습 사이트 출시(15주차) 후 곧 16으로 마이그 필요했을 것.

### Next.js canary/16.x-rc 채택

- 안정성 우선. canary는 학습 사이트엔 부적절.

## 재평가 트리거

- Next.js 16에서 본질적 호환 이슈로 실질적 개발 정체 발생 시 → 15.x로 후퇴 검토
- Next.js 17이 stable로 나오고 그것 역시 큰 차이 없는 점진적 변경이면 17 상향 검토 (출시 후)

## 함께 갱신된 문서

- `CLAUDE.md` 플랫폼 라인
- `docs/STACK.md` 프레임워크 행 + Next.js 섹션
- `docs/ROADMAP.md` Day 1 체크박스
- `docs/superpowers/specs/2026-05-03-day1-setup-design.md`
- `docs/superpowers/plans/2026-05-03-day1-setup.md`
