# DECISIONS — Architecture Decision Records

이 폴더는 프로젝트의 주요 결정을 기록한 ADR(Architecture Decision Records) 모음이다.

## 왜 기록하는가

- 새 Claude 인스턴스나 협업자가 *왜 이렇게 했는지* 추적 가능
- 거부된 대안과 그 이유를 보존하여 같은 논의 반복 방지
- 결정 재평가 시점·트리거를 명시하여 적절한 시점에 재검토

## 파일명 규칙

```
NNNN-kebab-case-title.md
```

- `NNNN`: 4자리 zero-pad, 1부터 순차 증가
- 파일명만으로 결정 내용 추정 가능하도록

## 표준 템플릿

```markdown
# NNNN. 제목

- **Status**: Proposed | Accepted | Deprecated | Superseded by NNNN
- **Date**: YYYY-MM-DD

## Context

결정이 필요한 배경, 제약, 후보들.

## Decision

채택한 결정. 명확하고 단호하게.

## Consequences

### 긍정

- 채택의 장점

### 부정

- 채택의 단점·트레이드오프

## 거부된 대안

각 대안과 거부 이유.

## (선택) 재평가 트리거

언제·어떤 조건에서 이 결정을 다시 볼지.
```

## 현재 ADR 목록

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| 0001 | MDX over CMS | Accepted |
| 0002 | Supabase over Firebase | Accepted |
| 0003 | Sidebar Tree over React Flow MVP | Accepted |
| 0004 | Learning First, Evaluation Later | Accepted |
| 0005 | Next.js + PWA Single Platform | Accepted |
| 0006 | FE Depth over Broad Coverage | Accepted |
| 0007 | Content Composition Principle | Accepted |

## 새 ADR 추가 시점

- 라이브러리·도구 도입/거부 결정
- 아키텍처 패턴 변경
- 프로덕트 방향성 큰 변경
- v2~v3 로드맵 항목 구체화 시

## 사소한 결정은 기록 X

- 변수명·파일명 컨벤션 → CONVENTIONS.md
- 콘텐츠 작성 가이드 → CONTENT_SCHEMA.md
- 일정 변경 → ROADMAP.md

ADR은 *되돌리기 어려운 결정*만.
