# CONTENT_SCHEMA.md — frontmatter 스키마와 콘텐츠 작성 가이드

## frontmatter 스키마 (확정)

```yaml
---
id: rendering-crp                    # URL slug (도메인-노드)
title: Critical Rendering Path
domain: rendering                    # 'rendering' | 'state' | 'performance' | 'async' | 'side-http' | 'side-auth' | 'side-db' | 'side-server'
order: 3                             # 도메인 내 순서 (1부터)
prerequisites:
  - rendering-html-parsing
  - rendering-cssom
estimatedMinutes: 15
difficulty: intermediate             # 'beginner' | 'intermediate' | 'advanced'
tags:
  - browser
  - performance-related
crossLinks:                          # 다른 도메인 노드와의 약한 연결
  - performance-reflow
  - performance-painting
status: published                    # 'draft' | 'review' | 'published'
updatedAt: 2026-05-03
summary: 브라우저가 HTML을 화면에 그리기까지의 단계 — 파싱부터 페인트까지의 흐름.
---
```

## 필드 명세

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string (kebab-case) | ✅ | URL slug + 진척도 DB 키. **변경 불가**. 신중히 결정 |
| `title` | string | ✅ | 노드 제목, 한국어 |
| `domain` | enum | ✅ | 8개 중 하나, 폴더와 일치 |
| `order` | number | ✅ | 도메인 내 정렬 (사이드바·다음 노드 네비) |
| `prerequisites` | string[] | ✅ (빈 배열 허용) | 학습 경로 트리의 엣지. 기존 노드 id |
| `estimatedMinutes` | number | ✅ | 예상 학습 시간 |
| `difficulty` | enum | ✅ | 3단계 |
| `tags` | string[] | ✅ (빈 배열 허용) | 검색·필터링 |
| `crossLinks` | string[] | ⬜ | 다른 도메인과의 약한 연결 (v1.1 그래프에서 활용) |
| `status` | enum | ✅ | `published`만 prod 노출 |
| `updatedAt` | YYYY-MM-DD | ✅ | 수동 갱신 |
| `summary` | string (1~2 문장) | ✅ | 학습 목표 + 사이드바 호버 미리보기 |

## Zod 검증 (예시)

빌드 시점에 검증하여 잘못된 frontmatter는 빌드 실패 처리한다.

```ts
// src/lib/content/schema.ts
import { z } from 'zod';

export const FrontmatterSchema = z.object({
  id: z.string().regex(/^[a-z]+(-[a-z0-9]+)*$/, 'kebab-case 필수'),
  title: z.string().min(1),
  domain: z.enum([
    'rendering', 'state', 'performance', 'async',
    'side-http', 'side-auth', 'side-db', 'side-server',
  ]),
  order: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string()),
  crossLinks: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'published']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string().min(10),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;
```

빌드 스크립트(`scripts/validate-content.ts`)에서:
- 모든 `.mdx` 파일의 frontmatter 파싱
- 스키마 검증 + `prerequisites`·`crossLinks`의 id가 실제 존재하는지 확인
- 도메인 폴더와 `domain` 필드 일치 검증
- 도메인 내 `order` 중복 없음 검증
- 실패 시 빌드 중단

## 콘텐츠 디렉토리 구조

```
content/
├─ rendering/
│  ├─ 01-html-parsing.mdx
│  ├─ 02-cssom.mdx
│  ├─ 03-crp.mdx
│  └─ ...
├─ state/
├─ performance/
├─ async/
├─ side-http/
├─ side-auth/
├─ side-db/
└─ side-server/
```

파일명: `{order:02}-{slug}.mdx`. order와 slug는 frontmatter와 일치.

## 노드 본문 표준 템플릿

```mdx
---
id: rendering-crp
title: Critical Rendering Path
domain: rendering
order: 3
prerequisites:
  - rendering-html-parsing
  - rendering-cssom
estimatedMinutes: 15
difficulty: intermediate
tags:
  - browser
  - performance-related
crossLinks:
  - performance-reflow
status: published
updatedAt: 2026-05-03
summary: 브라우저가 HTML·CSS를 받아 화면에 그리기까지의 5단계 — DOM·CSSOM·Render Tree·Layout·Paint.
---

## 핵심 개념

(외부 자료 기반의 정확한 설명. 단순 번역 X, 본인 표현으로.)

## 동작 흐름

1. HTML 파싱 → DOM
2. CSS 파싱 → CSSOM
3. Render Tree 구성
4. Layout (Reflow)
5. Paint
6. Composite

(필요 시 다이어그램 또는 단계별 설명)

## 코드 예시

(LLM 보조로 빠르게, 실행 가능한 최소 예시)

```ts
// 예: 렌더링 차단을 피하는 패턴
```

## 실무 포인트

> 본인 경험 — 차별화의 핵심.
> 예: OfficeNEXT 메신저에서 채팅 목록의 reflow 비용을 줄이기 위해 `transform: translate3d`로 GPU 합성 레이어 분리. 측정 결과 스크롤 60fps 안정.

(구체적인 사례·수치·전후 비교를 포함)

## 자주 하는 오해

- ❌ "Reflow와 Repaint는 같다"
- ✅ Reflow는 레이아웃 재계산 + Paint, Repaint는 Paint만

## 다음 학습

- [Reflow vs Repaint](/learn/rendering/reflow-vs-repaint) (선수 관계 자동 표시되지만 본문 권유 추가도 OK)

## 참고 자료

- [Render-tree Construction, Layout, and Paint (web.dev)](https://web.dev/...)
- [Critical Rendering Path (MDN)](https://developer.mozilla.org/...)
```

## 노드 작성 워크플로

### Step 1: 외부 자료 1차 출처 정리 (30분)

- 신뢰 출처 우선: MDN, web.dev, 공식 문서, RFC
- 한국 기술블로그: 토스, 카카오, 우아한형제들, 라인 등
- 출처는 메모해두기 (참고 자료 섹션에 사용)

### Step 2: LLM에 구조 초안 요청 (15분)

권장 프롬프트 패턴:

```
다음 주제에 대한 학습 노드 본문 초안을 작성해줘.

주제: Critical Rendering Path
대상: FE 1~5년차
선수 지식: HTML 파싱, CSSOM
구조: 핵심 개념 → 동작 흐름 → 코드 예시 → 자주 하는 오해

요구사항:
- 한국어, 평어(~다)
- 코드 예시는 50줄 이내, 실행 가능
- 외부 자료 인용 X (내가 직접 추가)
- "실무 포인트" 섹션은 비워둘 것 (내가 직접 작성)
```

### Step 3: 본인 경험·실무 포인트 작성 (1.5~2시간)

차별화의 핵심. 다음 질문에 답하며 작성:

- 실무에서 이 개념이 *왜* 중요한가?
- 내가 이 개념을 적용해서 해결한 문제가 있는가?
- 측정 가능한 효과가 있는가? (전후 수치)
- 흔한 오해·실수는?

OfficeNEXT, IndexedDB, Web Worker, 성능 최적화 경험을 적극 활용.

### Step 4: 코드 예시·다이어그램 (45분)

- 코드는 LLM 초안에서 시작, 본인 경험 기반으로 수정
- 다이어그램은 Mermaid 또는 손으로 그려서 SVG export

### Step 5: 검수 (30분)

체크리스트:
- [ ] frontmatter 모든 필수 필드 채워짐
- [ ] `prerequisites` id 모두 실제 존재
- [ ] LLM 글 미세하게 틀린 곳 없는지 (특히 브라우저·React 동작)
- [ ] 외부 자료 인용 출처 표기
- [ ] 본인 경험 섹션 채워짐
- [ ] 코드 예시 실행 가능
- [ ] 50줄 초과 코드 블록 없음
- [ ] `status: published`로 변경

## 노드 작성 페이스 가이드

- 노드당 약 4시간 → 풀타임 주 5일 = 주 10 노드
- 막힐 때: `status: draft` 유지, 다음 노드로 이동
- 매주 일요일 진척도 점검 (월 40~50 노드 못 나오면 범위 재검토)

## 자주 하는 콘텐츠 안티패턴

- ❌ LLM 글을 그대로 붙여넣기 (미묘하게 틀린 설명, 표면적 깊이)
- ❌ MDN 문장 직역 (저작권 + 차별화 약화)
- ❌ "본인 경험" 섹션을 LLM이 가짜로 생성하게 두기 (신뢰 무너짐)
- ❌ 코드 예시 없이 글만 (학습 효과 ↓)
- ❌ 노드 하나가 너무 길어 30분+ 학습 시간 (분할)
- ❌ frontmatter `prerequisites` 빠뜨리고 publish (트리 구조 깨짐)

## crossLinks 가이드 (v1.1에서 활용)

`prerequisites`는 *같은 도메인 또는 자연스러운 순서*의 노드.
`crossLinks`는 *다른 도메인의 관련 노드*. 강제 학습 순서 아님, 참고용.

예:
- `rendering-reflow`의 `crossLinks`: `performance-reflow-cost`, `state-batch-update`
- `state-react-query`의 `crossLinks`: `async-promise`, `performance-network`

MVP에서는 `crossLinks` 작성하되 UI에 노출 안 함 (v1.1에서 그래프로 노출).
