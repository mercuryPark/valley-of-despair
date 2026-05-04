# 제품 피벗 구현 계획 (cross-domain 큐레이션 학습 노트)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** valleyofdespair를 FE 깊이·본인 경험 중심에서 cross-domain 큐레이션 학습 노트로 피벗. 도메인 6개로 재정의, 본인 경험 차별화 제거, 4 기둥(연결·쉬움·실무·검증) 도입, 더미 노드 6개로 인프라 재검증.

**Architecture:** 코드(`schema.ts` enum/메타·페이지 푸터)·문서(PRODUCT/CONTENT_SCHEMA/STACK/ROADMAP/CONVENTIONS/CLAUDE)·ADR·콘텐츠(6개 더미 노드)를 단일 브랜치에 병합. PR-A(인프라+문서+ADR)와 PR-B(콘텐츠) 2단 분리 권장.

**Tech Stack:** TypeScript, Next.js 16, MDX, Zod, gray-matter (변경 없음 — 스키마 enum 값과 도메인 메타만 교체)

**참조:** `docs/superpowers/specs/2026-05-04-product-pivot-design.md`

---

## 파일 구조

### 코드 변경

| 파일                                     | 책임               | 변경 종류                      |
| ---------------------------------------- | ------------------ | ------------------------------ |
| `src/lib/content/schema.ts`              | 도메인 enum + 메타 | DOMAINS·DOMAIN_META 6개로 교체 |
| `src/app/learn/[domain]/[slug]/page.tsx` | 노드 페이지        | 푸터에 큐레이션 안내 1줄 추가  |

### 콘텐츠 변경

| 파일                                          | 변경 종류                            |
| --------------------------------------------- | ------------------------------------ |
| `content/rendering/01-html-parsing.mdx`       | 삭제 (이동 후 폴더 비움)             |
| `content/foundations/01-html-parsing.mdx`     | 새 위치, 9 섹션 표준으로 본문 재작성 |
| `content/frontend/01-rendering-pipeline.mdx`  | 신규                                 |
| `content/backend/01-rest-api-design.mdx`      | 신규                                 |
| `content/database/01-relational-vs-nosql.mdx` | 신규                                 |
| `content/cloud/01-deploy-vs-host.mdx`         | 신규                                 |
| `content/cs/01-time-complexity.mdx`           | 신규                                 |

### 문서 변경

| 파일                                                         | 변경 종류                                         |
| ------------------------------------------------------------ | ------------------------------------------------- |
| `docs/PRODUCT.md`                                            | 재작성 (정의·타겟·차별화·합성 비중·도메인·로드맵) |
| `docs/CONTENT_SCHEMA.md`                                     | 재작성 (9 섹션·자가 점검 패턴·푸터 안내)          |
| `docs/STACK.md`                                              | 도메인 표·안티패턴 갱신                           |
| `docs/ROADMAP.md`                                            | 5~12주차 양 목표·"인프라 먼저" 트랙 반영          |
| `docs/CONVENTIONS.md`                                        | "본인 경험 1인칭" 제거, 무인칭 평어 명시          |
| `CLAUDE.md`                                                  | 정의·타겟·차별화·도메인·안티패턴 갱신             |
| `docs/DECISIONS/0010-product-pivot-cross-domain-curation.md` | 신규 ADR                                          |

---

## Task 1: 도메인 스키마 마이그레이션

**Files:**

- Modify: `src/lib/content/schema.ts`

- [ ] **Step 1: 현재 schema.ts 확인**

Run:

```bash
cat src/lib/content/schema.ts
```

확인 항목: 기존 `DOMAINS` 8개 + `DOMAIN_META` 8 항목 + `FrontmatterSchema` (도메인 enum 사용).

- [ ] **Step 2: schema.ts 전체 교체**

`src/lib/content/schema.ts` 전체를 다음으로 교체:

```ts
import { z } from 'zod';

export const DOMAINS = ['foundations', 'frontend', 'backend', 'database', 'cloud', 'cs'] as const;

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
```

- [ ] **Step 3: 타입체크**

Run:

```bash
pnpm typecheck
```

Expected: 정상 종료(stdout만, exit 0). `loadNode` / `listNodesByDomain` 등에서 사용하는 도메인 enum이 자동으로 새 값을 받아들이므로 컴파일 통과.

- [ ] **Step 4: 린트**

Run:

```bash
pnpm lint
```

Expected: exit 0.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/content/schema.ts
git commit -m "refactor(content): DOMAINS·DOMAIN_META를 6개(foundations/frontend/backend/database/cloud/cs)로 교체"
```

---

## Task 2: 기존 더미 노드 이동·재정합

**Files:**

- Move: `content/rendering/01-html-parsing.mdx` → `content/foundations/01-html-parsing.mdx`
- Delete: `content/rendering/` (빈 폴더)

> 참고: 본문 9 섹션 재작성은 Task 11에서 수행. 이 Task는 위치 이동 + frontmatter 정리까지만.

- [ ] **Step 1: 새 도메인 폴더 생성**

Run:

```bash
mkdir -p content/foundations
```

- [ ] **Step 2: 파일 이동 (git 추적 보존)**

Run:

```bash
git mv content/rendering/01-html-parsing.mdx content/foundations/01-html-parsing.mdx
```

- [ ] **Step 3: frontmatter 갱신**

`content/foundations/01-html-parsing.mdx` 상단 frontmatter를 다음으로 변경:

```yaml
---
id: foundations-html-parsing
title: HTML 파싱과 DOM 구성
domain: foundations
order: 1
prerequisites: []
estimatedMinutes: 12
difficulty: beginner
tags:
  - browser
  - dom
status: published
updatedAt: 2026-05-04
summary: 브라우저가 바이트 스트림으로 받은 HTML을 토큰화·파싱해 DOM 트리를 만드는 과정과 그 사이에서 일어나는 차단 동작.
---
```

변경 사항:

- `id: rendering-html-parsing` → `foundations-html-parsing`
- `domain: rendering` → `foundations`
- `crossLinks: [performance-reflow]` 행 삭제 (미존재 노드 참조, dangling)
- `updatedAt: 2026-05-03` → `2026-05-04`

본문(`---` 아래) 은 그대로 유지 (Task 11에서 9 섹션으로 재작성).

- [ ] **Step 4: 빈 폴더 삭제**

Run:

```bash
rmdir content/rendering
```

Expected: 빈 폴더면 정상 삭제. 안의 파일이 남아 있으면 에러 → 이동이 빠진 게 있다는 뜻.

- [ ] **Step 5: 콘텐츠 검증**

Run:

```bash
pnpm content:check
```

Expected:

```
✓ content 검증 통과: 1개 노드
```

- [ ] **Step 6: 빌드 (라우팅이 새 도메인 슬러그를 받는지)**

Run:

```bash
pnpm build
```

Expected 출력에 다음 라우트가 보여야 함:

```
├ ● /learn/[domain]
│ ├ /learn/foundations
│ ├ /learn/frontend
│ ├ /learn/backend
│ └ [+3 more paths]
└ ● /learn/[domain]/[slug]
  └ /learn/foundations/html-parsing
```

- [ ] **Step 7: 커밋**

```bash
git add content/
git commit -m "content: rendering/01-html-parsing → foundations/01-html-parsing 이동 + frontmatter 정리"
```

---

## Task 3: 노드 페이지 푸터에 큐레이션 안내

**Files:**

- Modify: `src/app/learn/[domain]/[slug]/page.tsx`

- [ ] **Step 1: 현재 페이지 컴포넌트 확인**

Run:

```bash
grep -n 'mdx-body' src/app/learn/\[domain\]/\[slug\]/page.tsx
```

Expected: `mdx-body` 클래스를 가진 div와 그 다음 `(prev || next) && (` nav 가 있어야 함.

- [ ] **Step 2: 본문과 prev/next 사이에 푸터 안내 삽입**

`src/app/learn/[domain]/[slug]/page.tsx`의 본문(`<MDXRemote ... />`) 직후, prev/next 네비 직전에 다음 마크업 추가:

```tsx
<p className="text-muted-foreground border-border mt-8 border-t pt-4 text-xs">
  이 노드는 외부 자료(MDN·web.dev·공식 문서)와 LLM 보조로 정리한 학습 노트입니다.
</p>
```

위치는 다음과 같이:

```tsx
      <div className="mdx-body space-y-4 leading-7">
        <MDXRemote source={node.body} options={{ mdxOptions }} />
      </div>

      <p className="text-muted-foreground border-border mt-8 border-t pt-4 text-xs">
        이 노드는 외부 자료(MDN·web.dev·공식 문서)와 LLM 보조로 정리한 학습 노트입니다.
      </p>

      {(prev || next) && (
        <nav ...>
```

- [ ] **Step 3: 타입체크 + 린트**

Run:

```bash
pnpm typecheck && pnpm lint
```

Expected: 둘 다 exit 0.

- [ ] **Step 4: 빌드 확인**

Run:

```bash
pnpm build
```

Expected: SSG 정상, `/learn/foundations/html-parsing` 경로 prerender.

- [ ] **Step 5: 커밋**

```bash
git add src/app/learn/\[domain\]/\[slug\]/page.tsx
git commit -m "feat(learn): 노드 페이지 푸터에 큐레이션 안내 1줄 추가"
```

---

## Task 4: PRODUCT.md 재작성

**Files:**

- Modify: `docs/PRODUCT.md` (전체 교체)

- [ ] **Step 1: 새 PRODUCT.md 작성**

`docs/PRODUCT.md` 전체를 다음으로 교체:

````markdown
# PRODUCT.md — 컨셉·정체성

## 한 문장 정의

Dunning–Kruger 절망의 골짜기에 있는 2~5년차 개발자가 분야별로 끊어져 있던 지식을 실무 기반 예시로 연결하며 쉽게 학습하고, 자가 점검으로 이해도를 확인하면서 자신감을 회복할 수 있는 학습 노트형 플랫폼.

## 정체성

| 항목        | 결정                                                       |
| ----------- | ---------------------------------------------------------- |
| 카테고리    | **학습 노트형 플랫폼**                                     |
| 사용자 모드 | **자유 탐색** (선형 강제 진행 아님)                        |
| 콘텐츠 깊이 | **2~5년차 적정 깊이** (얕은 위키도, 박사 논문도 아님)      |
| 평가 시스템 | **자가 점검만** (체크리스트·시나리오 펼치기 — 점수/랭킹 X) |
| 랭킹        | **없음**. 영구 거부                                        |
| 수익화      | **없음**. 학습·포트폴리오 목적                             |

## 타겟

- **주 타겟**: 2~5년차 개발자 (FE/BE/풀스택/데브옵스 등 직군 불문)
- **부 타겟**: 1~2년차 중 깊이 욕심 있는 주니어, 직군 전환 준비자
- **1차 사용자**: 본인 (자가 학습 + 노트 큐레이션)
- **2차 사용자**: 커뮤니티 (콘텐츠 품질 합격선 도달 후 공개)
- **제외**: 코딩 입문자, 1년차 미만

## 동기 (왜 만드는가)

이름 `valleyofdespair`는 Dunning–Kruger 곡선의 "절망의 골짜기"를 가리킨다. 자신감과 실력 사이에 가장 큰 갭이 벌어지는 구간 — _"이미 코드는 짜는데 실무가 자꾸 어색하다"_ 고 느끼는 시기.

이 시기 학습자가 부딪히는 통증 3개:

1. 기존 자료가 깊이는 충분하지만 분야별로 분리되어 있어 **연결이 어려움** (DB → API → FE 따로 학습)
2. 영어 또는 복잡한 한국어로 **러닝커브가 높음** — 공부는 되지만 피로감 큼
3. 학습 후 **검증 어려움** — "내가 진짜 아는 건지" 실무의 다양한 케이스로 확인 어려움

이 통증 3개를 4 기둥(아래)으로 직접 받아낸다. 작은 격려와 큰 그림 — 그게 골짜기를 빠져나오는 손잡이.

## 차별화 4 기둥 (모두 동등)

| #   | 기둥                                                                  | 받아낸 통증 |
| --- | --------------------------------------------------------------------- | ----------- |
| 1   | **분야 간 연결성** — 같은 개념이 다른 분야에서 어떻게 나타나는지 명시 | 1           |
| 2   | **쉬운 설명** — 평이한 한국어, 짧은 단락, 다이어그램·예시             | 1, 2        |
| 3   | **실무 시나리오** — 노드마다 "실무에서 부딪히는 케이스 + 풀이"        | 3           |
| 4   | **자가 점검** — 체크리스트(개념) + 시나리오형 질문(응용)              | 3           |

어느 기둥을 빼도 통증 1~3 중 하나가 미해결로 남는다.

## MVP 범위

### 도메인 6개

| slug          | 한국어 라벨       | 범위                                       |
| ------------- | ----------------- | ------------------------------------------ |
| `foundations` | Web 기초          | HTML/CSS/HTTP, 브라우저 기본, 웹 표준      |
| `frontend`    | 프론트엔드        | 렌더링·상태·React/Vue·번들·클라이언트 성능 |
| `backend`     | 백엔드 (API 포함) | 서버·API 설계·REST/GraphQL·인증·인가       |
| `database`    | 데이터베이스      | 관계·NoSQL·트랜잭션·인덱스·정합성          |
| `cloud`       | 클라우드·DevOps   | AWS·CI/CD·인프라 기초·관측                 |
| `cs`          | 컴퓨터 과학       | 알고리즘·자료구조·OS·네트워크 기초         |

### 콘텐츠 양 목표

| 시점      | 목표                     | 비고                 |
| --------- | ------------------------ | -------------------- |
| 더미 단계 | 6개 (도메인당 1)         | 인프라 검증          |
| MVP 출시  | 30~40개 (도메인당 5~7)   | 커뮤니티 공개 합격선 |
| 장기      | 60~80개 (도메인당 10~13) | 도메인 깊이 균형     |

## 콘텐츠 합성 원칙

| 소스                                                        | 역할                                       | 비중 |
| ----------------------------------------------------------- | ------------------------------------------ | ---- |
| 외부 자료 (MDN, web.dev, 공식 문서, 토스/카카오 기술블로그) | 1차 출처·정확성 보증                       | 50%  |
| LLM 보조                                                    | 구조 초안·예시 코드·자가 점검 질문 생성    | 40%  |
| 본인 큐레이션·검수                                          | 정확성 점검·연결성 식별·실무 시나리오 발굴 | 10%  |

본인 실무 경험 1인칭 비중은 **0%로 의도적 설계** — 이 사이트는 본인의 지식을 담는 곳이 아니라 외부 자료를 _연결·쉽게·실무·검증_ 4 기둥으로 큐레이션하는 학습 노트.

## 노드 본문 9 섹션 표준

상세는 [`CONTENT_SCHEMA.md`](./CONTENT_SCHEMA.md) 참조.

## 차별화 (경쟁 비교)

```
                roadmap.sh   인프런/Udemy   기존 한국 블로그   valleyofdespair
시각화          매우 강함     중간           약함              중간 (사이드바 → v1.1 그래프)
콘텐츠 깊이     얕음         깊음           편차 큼            적정 (2~5년차 톤)
한국어          약함         강함           강함              강함
분야 간 연결    약함         약함           약함              **명시적 (cross-link + 본문 섹션)**
실무 시나리오   거의 없음    있음           편차 큼            **모든 노드 필수**
자가 점검       없음         퀴즈(별도)     없음              **본문에 통합**
자유 탐색       강함         약함           강함              강함
```

## 명시적으로 거부한 방향

- ❌ 평가·점수·랭킹 시스템 (v2 이후) — 단, 자가 점검(체크리스트·시나리오 펼치기)은 평가 아님 → MVP 포함
- ❌ AI 대화형 시뮬레이션 (v3) — LLM 페르소나 붕괴·비용·복잡도
- ❌ 사이트 내 LLM API 통합 (v3) — 콘텐츠 작성 보조는 외부 도구로
- ❌ 학습 게임 UI (Three.js 트리, 5스텝 클리어 게이팅) — 자유 탐색 파괴
- ❌ 본인이 검수하지 않은 LLM 출력을 그대로 publish — `status: draft → review → published` 단계 강제
- ❌ "분야 간 연결" 섹션을 억지로 채우기 — 진짜 연결 있을 때만
- ❌ 자가 점검 체크리스트가 본문 요약과 동일 — 본문은 학습, 점검은 응용
- ❌ 노드 하나가 6개 도메인 동시 다룸 — 한 노드 = 한 핵심 개념
- ❌ 웹 + 앱 동시 개발 — 1인 개발 부담, RN은 v2 이후

## 사용자 시나리오 (가상)

### 시나리오 1: "출퇴근길 학습"

지하철에서 PWA 접속 → 사이드바에서 "백엔드" 도메인 → "REST API 설계" 노드 → 5분 분량 읽기 → 자가 점검 체크리스트 확인 → 완료 표시.

### 시나리오 2: "분야 간 연결 학습"

"DB 인덱스" 노드 본문 끝의 "분야 간 연결" 섹션에서 "API 페이지네이션 성능" cross-link 발견 → 클릭해 backend 도메인 노드로 이동. 같은 인덱스 개념이 backend에서 어떻게 쓰이는지 확인.

### 시나리오 3: "트러블슈팅 중 빠른 참조"

검색창에 "reflow" → Pagefind가 frontend·foundations 도메인 노드 표시 → 클릭 후 자가 점검 시나리오 질문에서 본인 케이스와 비교.

## v2~v3 로드맵 (참고용, MVP에 영향 없음)

- **v2**: 도메인별 React Flow 그래프, 노드 단위 객관식 퀴즈(선택), BE/Cloud 도메인 깊이 확장, 학습 통계
- **v3**: AI 기반 동적 시나리오·대화형 시뮬레이션, 다축 평가, 종합 랭킹

이 항목들은 MVP에 일체 포함하지 않는다.
````

- [ ] **Step 2: 커밋**

```bash
git add docs/PRODUCT.md
git commit -m "docs(product): 제품 정체성 재작성 (D-K 골짜기·4 기둥·6 도메인·합성 비중)"
```

---

## Task 5: CONTENT_SCHEMA.md 재작성

**Files:**

- Modify: `docs/CONTENT_SCHEMA.md` (전체 교체)

- [ ] **Step 1: 새 CONTENT_SCHEMA.md 작성**

`docs/CONTENT_SCHEMA.md` 전체를 다음으로 교체:

````markdown
# CONTENT_SCHEMA.md — frontmatter 스키마와 콘텐츠 작성 가이드

## frontmatter 스키마 (확정)

```yaml
---
id: foundations-html-parsing # URL slug + 진척도 DB 키. **변경 불가**
title: HTML 파싱과 DOM 구성
domain: foundations # 'foundations' | 'frontend' | 'backend' | 'database' | 'cloud' | 'cs'
order: 1 # 도메인 내 순서 (1부터)
prerequisites: # 학습 경로 트리의 엣지. 기존 노드 id (필수, 빈 배열 허용)
  - foundations-http-basics
estimatedMinutes: 12
difficulty: beginner # 'beginner' | 'intermediate' | 'advanced'
tags:
  - browser
  - dom
crossLinks: # 다른 도메인의 약한 연결 (선택, dangling 허용 — warning만)
  - frontend-rendering-pipeline
status: published # 'draft' | 'review' | 'published'
updatedAt: 2026-05-04 # YYYY-MM-DD
summary: 브라우저가 바이트 스트림으로 받은 HTML을 토큰화·파싱해 DOM 트리를 만드는 과정.
---
```

## 필드 명세

| 필드               | 타입                | 필수              | 설명                                                |
| ------------------ | ------------------- | ----------------- | --------------------------------------------------- |
| `id`               | string (kebab-case) | ✅                | URL slug + 진척도 DB 키. **변경 불가**. 신중히 결정 |
| `title`            | string              | ✅                | 노드 제목, 한국어                                   |
| `domain`           | enum                | ✅                | 6개 중 하나, 폴더와 일치                            |
| `order`            | number              | ✅                | 도메인 내 정렬                                      |
| `prerequisites`    | string[]            | ✅ (빈 배열 허용) | 학습 경로 엣지. 미존재 시 build 실패                |
| `estimatedMinutes` | number              | ✅                | 예상 학습 시간                                      |
| `difficulty`       | enum                | ✅                | 3단계                                               |
| `tags`             | string[]            | ✅ (빈 배열 허용) | 검색·필터링                                         |
| `crossLinks`       | string[]            | ⬜                | 다른 도메인 약한 연결. 미존재 시 warning            |
| `status`           | enum                | ✅                | `published`만 prod 노출                             |
| `updatedAt`        | YYYY-MM-DD          | ✅                | 수동 갱신                                           |
| `summary`          | string (1~2 문장)   | ✅                | 학습 목표 + 사이드바 호버 미리보기                  |

## Zod 검증

`src/lib/content/schema.ts`의 `FrontmatterSchema`가 단일 출처. 빌드 시점에 `pnpm content:check`(`scripts/validate-content.ts`)이 검증:

- 모든 `.mdx`의 frontmatter Zod 검증
- 폴더 == frontmatter.domain
- 파일명 `{order:02}-{slug}.mdx` 패턴
- 전역 `id` 고유성, 도메인 내 `order` 고유성
- `prerequisites` 참조 무결성 (error → build 실패)
- `crossLinks` 참조 무결성 (warning → build 통과, dangling 허용)

## 콘텐츠 디렉토리 구조

```
content/
├─ foundations/
├─ frontend/
├─ backend/
├─ database/
├─ cloud/
└─ cs/
```

파일명: `{order:02}-{slug}.mdx`. order와 slug는 frontmatter와 일치.

## 노드 본문 9 섹션 표준

| #   | 섹션             | 필수 | 가이드                                                               |
| --- | ---------------- | ---- | -------------------------------------------------------------------- |
| 1   | 학습 목표        | 필수 | 1~2줄. frontmatter `summary` 활용                                    |
| 2   | 선수 지식        | 자동 | frontmatter `prerequisites` → 카드 자동 표시 (본문에 다시 쓰지 않음) |
| 3   | 핵심 개념        | 필수 | 평이한 한국어, 짧은 단락, 다이어그램                                 |
| 4   | 코드 / 시각 예시 | 필수 | 실행 가능한 최소 예시, 50줄 이내                                     |
| 5   | 실무 시나리오    | 필수 | "실무에서 부딪히는 케이스 + 풀이" 1~2개. 일반화된 사례               |
| 6   | 분야 간 연결     | 선택 | 관련 분야 있을 때만                                                  |
| 7   | 자가 점검        | 필수 | (a) 개념 체크리스트 3~5 + (b) 시나리오 1~3 + 답 펼치기               |
| 8   | 자주 하는 오해   | 선택 | "❌ ~ vs ✅ ~" 형식                                                  |
| 9   | 참고 자료        | 필수 | MDN/web.dev/공식 문서 등 외부 링크                                   |

### 자가 점검 마크다운 패턴

shadcn UI 의존 없이 순수 HTML `<details>`로 처리:

```markdown
## 자가 점검

### 개념 체크

- [ ] DOM이 어떻게 만들어지는지 설명할 수 있는가?
- [ ] 파싱을 차단하는 리소스와 그렇지 않은 리소스를 구분할 수 있는가?

### 시나리오

**Q1.** `<script>` 태그를 `<head>` 안에 두면 페이지 로딩에 어떤 영향을 주는가?

<details>
<summary>답 보기</summary>

`<script>` 태그는 기본적으로 파싱을 차단(parser-blocking)한다. ...

</details>
```

### 푸터 큐레이션 안내

페이지 컴포넌트(`src/app/learn/[domain]/[slug]/page.tsx`)에 모든 노드 공통으로 1줄 안내가 박혀 있음:

> _이 노드는 외부 자료(MDN·web.dev·공식 문서)와 LLM 보조로 정리한 학습 노트입니다._

콘텐츠 작성자는 본문에 이 안내를 다시 쓰지 않음.

### 톤·문체

- **평어 (~다)**, 무인칭 설명체. "나"·"우리" 1인칭 사용 X
- 영어 용어 첫 등장 시 한국어 병기 ("DOM (Document Object Model)")
- 한 단락 4문장 이내
- 다이어그램은 Mermaid 또는 SVG export

## 합성 비중

| 소스                                         | 역할                                       | 비중 |
| -------------------------------------------- | ------------------------------------------ | ---- |
| 외부 자료 (MDN·web.dev·공식 문서·기술블로그) | 1차 출처·정확성 보증                       | 50%  |
| LLM 보조                                     | 구조 초안·예시·자가 점검 질문 생성         | 40%  |
| 본인 큐레이션·검수                           | 정확성 점검·연결성 식별·실무 시나리오 발굴 | 10%  |

## 코드 블록

- 언어 명시 (`tsx`, `ts`, `bash`, `json`, `yaml`, `sql`...)
- 길이 제한: 한 블록 50줄 이내. 더 길면 분할 + 설명
- 실행 가능한 최소 예시. 의사코드 지양

## 외부 자료 인용

- 출처 명시 (블로그·공식 문서 링크)
- 직접 인용 최소화 (저작권 + 차별화 약화)
- 본문은 자기 표현으로 재구성

## 노드 작성 워크플로 (큐레이션 모드)

1. 외부 자료 1차 출처 정리 — MDN/web.dev/공식 문서/기술블로그 (30분)
2. LLM에 9 섹션 구조 초안 요청 — 핵심 개념·코드·시나리오·점검 (15분)
3. 본인 검수 — 정확성·연결성·실무 시나리오 보강 (40분)
4. `pnpm content:check` 통과 확인 (5분)
5. status: draft → review → published 단계 (1주 cool-down 권장)

## 자주 하는 콘텐츠 안티패턴

- ❌ LLM 글을 그대로 붙여넣기 (미묘하게 틀린 설명, 표면적 깊이)
- ❌ MDN 문장 직역 (저작권 + 차별화 약화)
- ❌ "분야 간 연결" 섹션을 억지로 채우기 (진짜 연결 있을 때만)
- ❌ 자가 점검 체크리스트가 본문 요약과 동일 (본문은 학습, 점검은 응용)
- ❌ 노드 하나가 6개 도메인 동시 다룸 (한 노드 = 한 핵심 개념)
- ❌ 코드 예시 없이 글만 (학습 효과 ↓)
- ❌ frontmatter `prerequisites` 빠뜨리고 publish (트리 구조 깨짐)
- ❌ 노드 하나가 너무 길어 30분+ 학습 시간 (분할)

## crossLinks 가이드

`prerequisites`는 *같은 도메인 또는 자연스러운 학습 순서*의 노드.
`crossLinks`는 _다른 도메인의 약한 연결_. 강제 학습 순서 아님, 참고용.

예:

- `database-indexing`의 `crossLinks`: `backend-api-pagination`, `cs-data-structures`
- `frontend-rendering-pipeline`의 `crossLinks`: `foundations-html-parsing`

dangling crossLink는 warning만 발생 (콘텐츠 점진 작성 허용). 모든 노드가 갖춰지면 warning 0건이 정상 상태.
````

- [ ] **Step 2: 커밋**

```bash
git add docs/CONTENT_SCHEMA.md
git commit -m "docs(content-schema): 9 섹션 표준 + 자가 점검 패턴 + 푸터 안내 + 6 도메인 반영"
```

---

## Task 6: STACK.md 갱신 (도메인 표·안티패턴)

**Files:**

- Modify: `docs/STACK.md`

> 전체 재작성 아님. 다음 4개 영역만 패치.

- [ ] **Step 1: 한 페이지 요약 표의 "트리 시각화" 줄 갱신**

`docs/STACK.md`에서 다음 행을 찾아 교체:

```diff
- | 트리 시각화         | 사이드바 (MVP) → React Flow (v1.1)                          | Three.js 트리, 자체 SVG                   |
+ | 트리 시각화         | 사이드바 (MVP) → React Flow 도메인 그래프 (v1.1)            | Three.js 트리, 자체 SVG                   |
```

(별 큰 변경 아니지만 "도메인 그래프" 라는 단어로 명료화)

- [ ] **Step 2: 안티패턴 명시 거부 목록 갱신**

다음 행들을 **삭제**:

```
- ❌ Notion API 콘텐츠 동기화
```

(이미 거부 명시 — 그대로 둠. 변경 없음.)

다음 행을 추가 (목록 마지막 즈음):

```markdown
- ❌ 본인이 검수하지 않은 LLM 출력을 그대로 publish (status: draft → review → published 강제)
- ❌ 사이트 노드 분류를 FE 4 도메인으로 한정 (현재 6개 동등 도메인: foundations/frontend/backend/database/cloud/cs)
- ❌ "본인 실무 경험" 1인칭 콘텐츠 의무화 (큐레이션 모델로 전환)
```

- [ ] **Step 3: "환경변수 표준" 다음에 도메인 표 추가**

`## 환경변수 표준 (.env.local)` 섹션 앞에 다음 섹션을 새로 추가:

```markdown
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
```

- [ ] **Step 4: 커밋**

```bash
git add docs/STACK.md
git commit -m "docs(stack): 도메인 6개 표 추가 + 큐레이션 모델 안티패턴 반영"
```

---

## Task 7: ROADMAP.md 갱신 (5~12주차 양 목표·"인프라 먼저" 트랙)

**Files:**

- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: "마일스톤 한눈에" 표 갱신**

다음 행을 찾아 교체:

```diff
- | 5~12  | 콘텐츠 작성 (8주)       | 메인 60~80 + 보조 20~40 = 80~120 노드                           |
+ | 5~12  | 콘텐츠 작성 (자유 페이스) | 더미 6 → MVP 30~40 → 장기 60~80 (도메인당 5~13)                  |
```

- [ ] **Step 2: "5~12주차" 섹션 전체 교체**

다음 섹션:

```markdown
## 5~12주차: 콘텐츠 작성 (8주)

이 8주가 일정의 가장 큰 변수. 매주 10~15 노드 페이스 유지.
...
```

를 다음으로 교체:

```markdown
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
```

- [ ] **Step 3: "일정 위험 신호" 섹션 갱신**

다음 행을 찾아 교체:

```diff
- - 5주차에 첫 도메인 5 노드 못 채움 → 노드 작성 워크플로 재검토 (외부 자료 합성 비중 ↑)
- - 9주차에 도메인 2개 못 끝남 → 보조 영역 제외, 메인만 유지
- - 13주차에 콘텐츠 50% 미만 → 출시 미루고 콘텐츠 우선 (3D 포기 검토)
+ - 인프라 마감 후 첫 30일 내 노드 12개 못 채움 → 큐레이션 워크플로 재검토 (외부 자료·LLM 비중 ↑)
+ - 60일 내 도메인 6개 모두 평균 5 노드 못 채움 → 도메인 2개로 압축 후 출시 (보강은 출시 후)
+ - 90일 내 콘텐츠 30개 미만 → 출시 미루고 콘텐츠 우선 (랜딩 3D 포기 검토)
```

- [ ] **Step 4: "1주차" / "2주차" 등 완료된 부분은 그대로 두기**

이미 `(완료)` 표기된 Day 1~5는 변경 없음.

- [ ] **Step 5: 2주차 항목 E 갱신**

기존 2주차 섹션의 항목 E를 다음으로 갱신 (피벗 반영):

```diff
- [ ] 더미 노드 5개 작성 (각 도메인 1개씩 + 보조 1개)
+ [ ] 더미 노드 6개 작성 — 6개 동등 도메인 각 1개씩 (피벗 반영, foundations/frontend/backend/database/cloud/cs)
```

- [ ] **Step 6: 커밋**

```bash
git add docs/ROADMAP.md
git commit -m "docs(roadmap): 5~12주차 양 목표·인프라 먼저 트랙·큐레이션 워크플로 반영"
```

---

## Task 8: CONVENTIONS.md 갱신 (1인칭 제거·평어 무인칭 명시)

**Files:**

- Modify: `docs/CONVENTIONS.md`

- [ ] **Step 1: "콘텐츠 작성 규칙 → 톤" 섹션 교체**

기존:

```markdown
### 톤

- 한국어 기본, 기술 용어는 영어 표기 허용 (예: "렌더링 파이프라인(Rendering Pipeline)")
- 존대 (~합니다) 또는 평어 (~다) — **하나로 통일**. 권장은 평어 (학습 자료 톤)
- 본인 경험은 1인칭 명시 ("실무에서 IndexedDB로 캐싱했을 때...")
```

를 다음으로 교체:

```markdown
### 톤

- 한국어 기본, 기술 용어는 영어 병기 (예: "DOM (Document Object Model)")
- **평어 (~다)**, 무인칭 설명체. "나"·"우리" 1인칭 사용 X
- 한 단락 4문장 이내
- 영어 직역 어색한 표현 회피, 한국어 자연스러운 어순 우선
- 다이어그램은 Mermaid 또는 SVG export
```

- [ ] **Step 2: "노드 표준 구조" 섹션 갱신**

기존 6 섹션 표준을 9 섹션으로 교체. 다음 섹션:

```markdown
### 노드 표준 구조

각 노드는 다음 6 섹션을 갖춤:

1. **학습 목표** (1~2줄, frontmatter `summary` 활용)
2. **선수 지식** (frontmatter `prerequisites` 자동 표시)
3. **핵심 개념** (외부 자료 기반 정확한 설명)
4. **코드/시각 예시** (LLM 보조)
5. **실무 포인트** (본인 경험 — 차별화 핵심)
6. **참고 자료** (외부 링크)
```

를 다음으로 교체:

```markdown
### 노드 표준 구조 (9 섹션)

자세한 가이드는 `docs/CONTENT_SCHEMA.md` 참조. 요약:

1. 학습 목표 (필수, 1~2줄)
2. 선수 지식 (자동 — frontmatter `prerequisites`)
3. 핵심 개념 (필수)
4. 코드 / 시각 예시 (필수)
5. 실무 시나리오 (필수, 일반화된 사례)
6. 분야 간 연결 (선택)
7. 자가 점검 (필수 — 체크리스트 + 시나리오 펼치기)
8. 자주 하는 오해 (선택)
9. 참고 자료 (필수)
```

- [ ] **Step 3: "합성 비중 (재확인)" 섹션 갱신**

기존:

```markdown
### 합성 비중 (재확인)

- 외부 자료 30% (정확성)
- LLM 30% (구조·예시)
- 본인 경험 40% (차별화)

본인 경험 비중이 낮은 노드는 `status: draft` 유지, 보강 후 publish.
```

를 다음으로 교체:

```markdown
### 합성 비중 (재확인)

- 외부 자료 50% (정확성·1차 출처)
- LLM 보조 40% (구조 초안·예시·자가 점검 질문)
- 본인 큐레이션·검수 10% (정확성 점검·연결성 식별·실무 시나리오 발굴)

본인 1인칭 실무 경험 비중은 0%로 의도적 설계 — 큐레이션 학습 노트 모델.
```

- [ ] **Step 4: "자주 빠지는 함정 → 콘텐츠" 섹션 갱신**

기존:

```markdown
### 콘텐츠

- ❌ LLM 글 그대로 붙여넣기 → 검수 필수
- ❌ 외부 자료 통째 인용 → 본인 표현으로 재구성
- ❌ 본인 경험 부분 생략 → 차별화 사라짐
- ❌ 노드 길이 욕심 → 한 노드 너무 길면 분할
```

를 다음으로 교체:

```markdown
### 콘텐츠

- ❌ LLM 글 그대로 붙여넣기 → 검수 필수
- ❌ 외부 자료 통째 인용 → 자기 표현으로 재구성
- ❌ "분야 간 연결" 섹션 억지로 채우기 → 진짜 연결 있을 때만
- ❌ 자가 점검 체크리스트가 본문 요약과 동일 → 본문은 학습, 점검은 응용
- ❌ 노드 하나가 6개 도메인 동시 다룸 → 한 노드 = 한 핵심 개념
- ❌ 노드 길이 욕심 → 한 노드 너무 길면 분할
```

- [ ] **Step 5: 커밋**

```bash
git add docs/CONVENTIONS.md
git commit -m "docs(conventions): 무인칭 평어·9 섹션 표준·큐레이션 합성 비중 반영"
```

---

## Task 9: CLAUDE.md 갱신

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: "이 프로젝트가 무엇인가" 섹션 교체**

기존:

```markdown
## 이 프로젝트가 무엇인가

FE 개발자가 실무에서 마주치는 핵심 4 도메인(렌더링·상태관리·성능·비동기/네트워크)을 선수→심화 학습 경로로 깊이 학습하고, 인접 BE/DB 기초까지 FE 시점에서 함께 정리하는 학습 플랫폼.

- **타겟**: FE 1~5년차
- **차별화**: 깊은 콘텐츠 + 본인 실무 경험(OfficeNEXT, IndexedDB·Web Worker 등) 녹임
- **MVP**: 학습 우선, 평가/AI 시뮬레이션은 v2~v3
- **플랫폼**: Next.js 16 + PWA 단일 (RN/Expo는 v2 이후)
```

를 다음으로 교체:

```markdown
## 이 프로젝트가 무엇인가

Dunning–Kruger 절망의 골짜기에 있는 2~5년차 개발자가 분야별로 끊어져 있던 지식을 실무 기반 예시로 연결하며 쉽게 학습하고, 자가 점검으로 이해도를 확인하면서 자신감을 회복할 수 있는 학습 노트형 플랫폼.

- **타겟**: 2~5년차 개발자 (FE/BE/풀스택/데브옵스 등 직군 불문). 1차 사용자는 본인.
- **도메인 6개 (동등)**: foundations / frontend / backend / database / cloud / cs
- **차별화 4 기둥 (모두 동등)**: 분야 간 연결 / 쉬운 설명 / 실무 시나리오 / 자가 점검
- **콘텐츠 합성**: 외부 자료 50% + LLM 보조 40% + 본인 큐레이션 10% (1인칭 실무 경험 0%)
- **MVP 출시 기준**: 30~40 노드. 평가/AI 시뮬레이션은 v2~v3
- **플랫폼**: Next.js 16 + PWA 단일 (RN/Expo는 v2 이후)
```

- [ ] **Step 2: "절대 하지 말 것" 섹션 갱신**

기존 목록 끝에 다음 4개 추가:

```markdown
- ❌ "본인 실무 경험"을 노드 본문에 1인칭으로 녹이기 (큐레이션 모델로 전환됨)
- ❌ 본인이 검수하지 않은 LLM 출력을 `status: published`로 바로 박기 (draft → review → published 강제)
- ❌ "분야 간 연결" 섹션을 억지로 채우기 (진짜 연결 있을 때만)
- ❌ 한 노드에서 6개 도메인 동시 다루기 (한 노드 = 한 핵심 개념)
```

기존 거부 목록 행은 모두 유지 (RN/Three.js/Pages Router/Redux/axios·fetch 등 그대로).

- [ ] **Step 3: "현재 진행 상황" 섹션 갱신**

기존:

```markdown
## 현재 진행 상황

- **단계**: 1주차 완료 → 2주차 시작 (콘텐츠 파이프라인 — 노드 라우팅·도메인 인덱스·더미 노드 5개)
- **방금 완료**: Day 5 (관측 + CI ...)
  ...
```

를 다음으로 교체:

```markdown
## 현재 진행 상황

- **단계**: 2주차 항목 E 직전 — 제품 피벗 완료, 더미 노드 6개 작성 진입
- **방금 완료**: 제품 피벗(`docs/superpowers/specs/2026-05-04-product-pivot-design.md` 합의 후 ADR 0010·문서 일괄·도메인 6개 마이그레이션)
- **prod URL**: https://valleyofdespair.vercel.app
- **주요 마일스톤**: 1~4주차 인프라 → 더미 콘텐츠 → 13~14주차 랜딩 3D → 15주차 출시 (콘텐츠는 자유 페이스, 30~40 도달 시 MVP 출시)

상세는 `docs/ROADMAP.md` 참조.
```

- [ ] **Step 4: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs(claude): 제품 피벗 반영 — 6 도메인·4 기둥·큐레이션 합성·진행 상황"
```

---

## Task 10: ADR 0010 추가 (제품 피벗 결정 기록)

**Files:**

- Create: `docs/DECISIONS/0010-product-pivot-cross-domain-curation.md`

> 기존 ADR 형식 확인 후 동일 형식 사용.

- [ ] **Step 1: 기존 ADR 형식 확인**

Run:

```bash
ls docs/DECISIONS/ && head -40 docs/DECISIONS/0001-*.md 2>/dev/null | head -40
```

목적: 기존 ADR 형식(헤더·섹션·번호 패딩)을 확인하고 새 ADR도 동일하게 맞춤.

- [ ] **Step 2: ADR 0010 작성**

`docs/DECISIONS/0010-product-pivot-cross-domain-curation.md` 작성:

```markdown
# 0010 — 제품 피벗: cross-domain 큐레이션 학습 노트

- **상태**: 채택
- **일자**: 2026-05-04
- **관련 spec**: `docs/superpowers/specs/2026-05-04-product-pivot-design.md`

## 컨텍스트

1주차 인프라 + 2주차 콘텐츠 파이프라인 인프라(라우팅·검증)까지 완료된 시점에 사용 의도와 차별화 방향을 재정의했다.

기존 컨셉:

- 타겟: FE 1~5년차
- 4개 FE 메인 도메인 + 4개 보조
- 차별화 90%: 콘텐츠 깊이 + 본인 실무 경험 1인칭
- 합성 비중: 외부 30% + LLM 30% + 본인 경험 40%

새 컨셉:

- 타겟: 2~5년차 개발자(직군 불문). 이름 valleyofdespair는 D-K 절망의 골짜기.
- 6개 동등 도메인 (foundations / frontend / backend / database / cloud / cs)
- 차별화 4 기둥 동등 (연결·쉬움·실무·검증)
- 합성 비중: 외부 50% + LLM 40% + 본인 큐레이션 10%, 본인 1인칭 0%

## 결정

피벗 채택. 코드(스키마·페이지)·문서(PRODUCT/CONTENT_SCHEMA/STACK/ROADMAP/CONVENTIONS/CLAUDE) 일괄 마이그레이션.

## 근거 (사용자 통증 → 4 기둥 매핑)

| #   | 통증                                                       | 받아낸 기둥                |
| --- | ---------------------------------------------------------- | -------------------------- |
| 1   | 분야별 자료 분리되어 연결 어려움 (DB → API → FE 따로 학습) | 분야 간 연결성 + 쉬운 설명 |
| 2   | 영어/복잡한 한국어로 러닝커브 높음                         | 쉬운 설명                  |
| 3   | 학습 후 검증 어려움                                        | 자가 점검 + 실무 시나리오  |

본인 실무 경험을 차별화의 핵심에서 제거한 이유:

- 1차 사용자가 본인이라는 컨텍스트로, 1인칭 자전적 콘텐츠보다 큐레이션이 자연스러움
- 1인칭 작성은 노드당 4시간 → 큐레이션은 1.5~2시간 (LLM 보조). 페이스 ↑
- 분야 6개 확장이 본인 경험으로는 커버 불가 (BE/Cloud 깊이 부족)

## 결과 (트레이드오프)

### 얻는 것

- 6 도메인 동등 — BE/DB/Cloud/CS도 동일 깊이로 학습 가능
- 작성 페이스 ↑ — 노드당 1.5~2시간 (이전 4시간)
- 분야 간 연결성이 새 차별화 — roadmap.sh·인프런·블로그 어디에도 약한 부분
- 자가 점검 통합 — 별도 퀴즈 사이트 안 가도 됨
- 1차 사용자가 본인이므로 작성·소비 루프가 짧음

### 잃는 것

- "본인 경험" 자전적 차별화 사라짐 — 다른 큐레이션 사이트와 차별점이 4 기둥 외에는 약해짐
- 외부 자료·LLM 의존 ↑ → 사실 검증 부담 ↑ (큐레이션 10% 비중이 안전판이지만 빠지면 LLM 환각 publish 위험)
- 도메인 폭이 넓어 작성자 본인의 깊이가 도메인별로 편차 발생 (특히 cloud/cs)

### 안티패턴 추가 (위험 차단)

- ❌ 본인이 검수하지 않은 LLM 출력을 그대로 publish — `status: draft → review → published` 단계 강제
- ❌ "분야 간 연결" 섹션을 억지로 채우기 — 진짜 연결 있을 때만
- ❌ 자가 점검 체크리스트가 본문 요약과 동일 — 본문은 학습, 점검은 응용
- ❌ 한 노드 = 6 도메인 동시 다룸 — 한 노드 = 한 핵심 개념

## 마이그레이션 영향

- 코드: `src/lib/content/schema.ts` 도메인 enum 8 → 6, 페이지 푸터 큐레이션 안내 1줄 추가
- 콘텐츠: `content/rendering/01-html-parsing.mdx` → `content/foundations/01-html-parsing.mdx` 이동 + frontmatter 갱신, 본문은 9 섹션 표준으로 재작성
- 신규 콘텐츠: 5개 새 도메인 더미 노드 1개씩 (총 6개 더미)
- 문서: PRODUCT/CONTENT_SCHEMA/STACK/ROADMAP/CONVENTIONS/CLAUDE 모두 갱신
- DB: Supabase `progress` 테이블 영향 없음 (현재 row 0건)

## 후속

- writing-plans 산출물 `docs/superpowers/plans/2026-05-04-product-pivot-implementation.md` 따라 단계별 실행
- 더미 6개 작성 후 prod 배포 → 사이드바·검색·자가 점검 동작 검증 → 3주차 작업 진입
```

- [ ] **Step 3: 커밋**

```bash
git add docs/DECISIONS/0010-product-pivot-cross-domain-curation.md
git commit -m "docs(adr): 0010 제품 피벗 (cross-domain 큐레이션) 결정 기록"
```

---

## Task 11: foundations/01-html-parsing.mdx 본문 9 섹션 재작성

**Files:**

- Modify: `content/foundations/01-html-parsing.mdx` (본문만, frontmatter는 Task 2에서 처리됨)

- [ ] **Step 1: 본문(`---` 아래 전체)을 9 섹션 표준으로 교체**

`content/foundations/01-html-parsing.mdx`의 `---` 끝 줄 이후 본문 전체를 다음으로 교체:

````mdx
## 학습 목표

브라우저가 바이트 스트림으로 받은 HTML을 토큰화·파싱해 DOM 트리를 만드는 과정과 그 사이에서 일어나는 차단 동작을 이해한다.

## 핵심 개념

브라우저는 서버에서 받은 HTML 바이트를 다음 단계로 처리해 DOM(Document Object Model)을 만든다.

1. **바이트 → 문자**: 인코딩(UTF-8 등)에 따라 바이트를 문자로 변환
2. **문자 → 토큰**: 토크나이저(Tokenizer)가 `<html>`, `</body>` 같은 시작/종료 태그·속성·텍스트를 토큰 단위로 잘라냄
3. **토큰 → 노드**: 각 토큰이 노드 객체로 만들어짐
4. **노드 → DOM 트리**: 노드들이 부모-자식 관계로 연결되어 트리 구조를 형성

이 과정에서 특정 리소스는 파싱을 차단(parser-blocking)한다.

- **차단**: 일반 `<script>` 태그 — 다운로드·실행이 끝날 때까지 파서가 정지
- **부분 차단**: 외부 CSS — DOM 파싱은 계속되지만 렌더링이 차단(CSSOM 완성 대기)
- **차단 안 함**: `<script async>`, `<script defer>`, preload된 리소스

## 코드 예시

다음 HTML을 받았을 때 파싱 동작을 비교해보자.

```html
<!-- 케이스 A: 기본 script — 파싱 차단 -->
<head>
  <script src="/heavy.js"></script>
</head>
<body>
  <h1>Hello</h1>
</body>

<!-- 케이스 B: defer — 파싱 차단 안 함, DOMContentLoaded 직전 실행 -->
<head>
  <script src="/heavy.js" defer></script>
</head>
<body>
  <h1>Hello</h1>
</body>
```

케이스 A에서는 `heavy.js` 다운로드·실행이 끝날 때까지 `<h1>Hello</h1>` 노드가 DOM에 추가되지 않는다. 케이스 B는 파서가 계속 진행하며 `<h1>`을 먼저 DOM에 넣고, `heavy.js`는 DOMContentLoaded 직전에 실행된다.

## 실무 시나리오

**케이스 1 — 첫 페이지 로딩이 느린 사이트**

분석 도구(Google Tag Manager, Hotjar 등)가 `<head>`에 `<script>`로 박혀 있어 페이지 첫 콘텐츠가 늦게 보인다. 사용자에게 노출되는 LCP(Largest Contentful Paint)가 2.5s를 넘는다.

해결: 분석 스크립트에 `defer` 또는 `async` 추가, 또는 `<body>` 끝으로 이동. defer는 실행 순서 보존(여러 스크립트 간 의존성 있을 때), async는 순서 무관한 단발성 스크립트에 적합.

**케이스 2 — 폰트 로딩으로 텍스트가 안 보임 (FOIT)**

페이지 진입 시 텍스트가 한동안 안 보이다가 갑자기 나타난다. 외부 CSS가 `@font-face`로 폰트를 받는 동안 렌더링이 차단되기 때문.

해결: `<link rel="preload" href="/font.woff2" as="font" crossorigin>` 으로 폰트를 우선 다운로드 시작, `font-display: swap`으로 폴백 폰트 먼저 표시.

## 분야 간 연결

- **frontend (렌더링 파이프라인)**: DOM 구성 후 CSSOM과 결합되어 Render Tree → Layout → Paint으로 이어짐. CRP(Critical Rendering Path)의 첫 단계
- **cs (자료구조)**: DOM은 트리 구조. 깊이 우선 탐색(DFS)으로 순회되는 일반적 트리 알고리즘과 동일

## 자가 점검

### 개념 체크

- [ ] DOM 트리가 만들어지는 4단계(바이트 → 문자 → 토큰 → 노드 → 트리)를 설명할 수 있는가?
- [ ] 파서 차단 / 렌더링 차단 / 비차단의 차이를 구분할 수 있는가?
- [ ] `async`와 `defer`의 차이를 실행 시점·순서 보존 관점에서 설명할 수 있는가?

### 시나리오

**Q1.** 다음 HTML에서 `<h1>` 태그가 화면에 처음 보이는 시점은 언제인가?

```html
<head>
  <link rel="stylesheet" href="/main.css" />
  <script src="/app.js"></script>
</head>
<body>
  <h1>Hello</h1>
</body>
```

<details>
<summary>답 보기</summary>

`/app.js` 다운로드·실행이 끝나야 `<h1>` 토큰이 DOM에 들어간다(파서 차단). 그 후에도 `/main.css`가 받아져야 CSSOM이 완성되고 렌더링이 시작된다. 즉, **두 리소스 중 늦게 끝나는 쪽** 직후에 `<h1>`이 화면에 나타난다.

</details>

**Q2.** 분석 스크립트를 `<body>` 끝에 두는 것과 `<head>`에 `defer`로 두는 것 중 어느 쪽이 더 빠른가?

<details>
<summary>답 보기</summary>

대부분의 경우 **`<head> + defer`가 더 빠르다**. 브라우저는 HTML 파싱 시작 시점에 `<head>` 안의 리소스를 발견하고 다운로드를 _백그라운드에서_ 시작하기 때문. `<body>` 끝에 두면 파서가 거기까지 도달해야 다운로드가 시작된다(=네트워크 idle 시간 발생).

단, defer는 DOMContentLoaded 직전에 실행되므로 *실행 시점*은 비슷하지만, *다운로드 완료 시점*이 빨라 전체 효과가 좋다.

</details>

## 자주 하는 오해

- ❌ "DOM과 HTML은 같다"
- ✅ HTML은 텍스트, DOM은 메모리 안의 트리 객체. JS로 `document.querySelector('h1')`처럼 접근 가능한 것은 DOM
- ❌ "`async`는 항상 `defer`보다 빠르다"
- ✅ async는 다운로드 끝나자마자 _파싱을 멈추고_ 실행. 여러 스크립트 간 순서가 중요하면 defer가 안전

## 참고 자료

- [Populating the page: how browsers work — MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work)
- [Constructing the Object Model — web.dev](https://web.dev/articles/critical-rendering-path-constructing-the-object-model)
- [Render-blocking Resources — web.dev](https://web.dev/articles/render-blocking-resources)
- [`<script>` async vs defer — HTML Living Standard](https://html.spec.whatwg.org/multipage/scripting.html#attr-script-async)
````

- [ ] **Step 2: 콘텐츠 검증**

Run:

```bash
pnpm content:check
```

Expected: `✓ content 검증 통과: 1개 노드` (warning 없음 — crossLinks 비어 있으므로 dangling 없음)

- [ ] **Step 3: 빌드**

Run:

```bash
pnpm build
```

Expected: `/learn/foundations/html-parsing` SSG.

- [ ] **Step 4: 커밋**

```bash
git add content/foundations/01-html-parsing.mdx
git commit -m "content(foundations): html-parsing 본문을 9 섹션 표준으로 재작성"
```

---

## Task 12: frontend/01-rendering-pipeline.mdx 작성

**Files:**

- Create: `content/frontend/01-rendering-pipeline.mdx`

- [ ] **Step 1: 폴더 생성**

Run:

```bash
mkdir -p content/frontend
```

- [ ] **Step 2: 새 노드 작성**

`content/frontend/01-rendering-pipeline.mdx` 생성:

````mdx
---
id: frontend-rendering-pipeline
title: 브라우저 렌더링 파이프라인
domain: frontend
order: 1
prerequisites:
  - foundations-html-parsing
estimatedMinutes: 15
difficulty: intermediate
tags:
  - rendering
  - performance
crossLinks:
  - cs-data-structures
status: published
updatedAt: 2026-05-04
summary: HTML·CSS를 받은 뒤 화면에 픽셀로 그려지기까지의 5단계 — DOM·CSSOM·Render Tree·Layout·Paint·Composite.
---

## 학습 목표

브라우저가 HTML과 CSS를 받아 화면에 픽셀로 그리기까지 거치는 단계와 각 단계에서 어떤 일이 일어나는지 이해한다.

## 핵심 개념

렌더링 파이프라인(Rendering Pipeline)은 다음 단계로 구성된다.

1. **DOM 구성** — HTML 파싱으로 DOM 트리 생성 (`foundations-html-parsing` 참조)
2. **CSSOM 구성** — CSS 파싱으로 CSSOM(CSS Object Model) 트리 생성
3. **Render Tree 구성** — DOM + CSSOM 결합. `display: none`인 노드는 제외됨
4. **Layout (Reflow)** — 각 노드의 정확한 위치·크기 계산. 뷰포트 기반
5. **Paint** — 픽셀 값 계산 (색·테두리·그림자 등)
6. **Composite** — 레이어를 GPU에서 합성해 최종 화면 출력

각 단계는 이전 단계 결과에 의존한다. DOM·CSSOM 생성은 *병렬*이지만 Render Tree부터는 *순차*다.

## 코드 예시

다음 CSS는 각각 어느 단계까지 영향을 주는지 비교해보자.

```css
/* Layout부터 다시 — 가장 비쌈 */
.card {
  width: 200px;
}

/* Paint부터 — Layout 안 함 */
.card {
  background: red;
}

/* Composite만 — GPU에서 처리, 가장 쌈 */
.card {
  transform: translateX(100px);
}
```

JS에서 DOM을 변경할 때도 동일하다. `el.style.width = '300px'`는 Layout부터, `el.style.opacity = '0.5'`는 Composite만.

## 실무 시나리오

**케이스 1 — 스크롤 중 끊김**

긴 리스트를 스크롤할 때 끊김이 발생한다. DevTools Performance 탭에서 보면 매 프레임 Layout이 발생하고 있다.

원인: 리스트 아이템에 `position: absolute` + `top: ${index * 60}px` 식으로 위치를 잡고 있어, 스크롤 시 매번 Layout이 일어난다.

해결: `transform: translateY(${index * 60}px)`로 변경. transform은 Composite만 발생, 60fps 유지 가능.

**케이스 2 — 이미지 갤러리에서 클릭 시 깜빡임**

이미지 클릭 → 모달 열기 시 화면이 한 번 깜빡인다.

원인: 모달이 `display: none` → `display: block`으로 토글되며 Layout 전체가 다시 계산됨.

해결: `display` 대신 `opacity` + `pointer-events`로 토글. 또는 `visibility: hidden`(Layout은 차지하지만 Paint 안 됨).

## 분야 간 연결

- **foundations**: DOM 구성은 Web 기초의 HTML 파싱 결과. CSSOM은 Web 기초의 CSS 파싱 결과
- **cs (자료구조)**: Render Tree는 DOM 트리에서 일부 노드를 필터한 결과. 트리 자료구조 변환의 한 사례

## 자가 점검

### 개념 체크

- [ ] 렌더링 파이프라인 6단계의 이름과 순서를 말할 수 있는가?
- [ ] Layout / Paint / Composite의 비용 차이를 설명할 수 있는가?
- [ ] DOM 구성과 CSSOM 구성이 병렬인지 순차인지 말할 수 있는가?

### 시나리오

**Q1.** 다음 두 코드의 성능 차이는?

```js
// A
el.style.left = '100px';

// B
el.style.transform = 'translateX(100px)';
```

<details>
<summary>답 보기</summary>

**B가 압도적으로 쌈**. A는 `left` 속성이 Layout에 영향을 주므로 Layout → Paint → Composite 전부 다시 일어난다. B는 transform이 GPU 합성 속성이므로 Composite만 발생, Layout/Paint 스킵.

스크롤·드래그 같은 매 프레임 변하는 위치는 항상 transform 권장.

</details>

**Q2.** 어떤 페이지 로딩 시 렌더링이 시작되지 않고 흰 화면만 보인다. CSS 파일 다운로드를 모니터링하면 정상 완료. 무엇이 문제일 수 있는가?

<details>
<summary>답 보기</summary>

**JS의 파서 차단 + Render Tree 미완성**. 외부 CSS가 받아져 CSSOM은 완성됐어도, `<head>`에 박힌 일반 `<script>`가 다운로드·실행 중이면 파서가 멈춰 DOM이 미완성 상태. Render Tree는 DOM·CSSOM 둘 다 필요하므로 렌더링이 시작 안 됨.

해결: `<script defer>` 또는 `<script async>` 적용 (`foundations-html-parsing` 참조).

</details>

## 자주 하는 오해

- ❌ "Reflow와 Repaint는 같은 것"
- ✅ Reflow(=Layout)는 위치·크기 재계산이 일어나는 것. Repaint(=Paint)는 픽셀 다시 그리는 것. Reflow가 일어나면 보통 Repaint도 동반된다(역은 아님)

## 참고 자료

- [Critical Rendering Path — web.dev](https://web.dev/articles/critical-rendering-path)
- [Rendering Performance — web.dev](https://web.dev/articles/rendering-performance)
- [CSS Triggers (어느 속성이 어느 단계 트리거하는지)](https://csstriggers.com/)
````

- [ ] **Step 3: 검증·커밋**

Run:

```bash
pnpm content:check && git add content/frontend/ && git commit -m "content(frontend): 렌더링 파이프라인 더미 노드"
```

---

## Task 13: backend/01-rest-api-design.mdx 작성

**Files:**

- Create: `content/backend/01-rest-api-design.mdx`

- [ ] **Step 1: 폴더 + 노드 작성**

Run:

```bash
mkdir -p content/backend
```

`content/backend/01-rest-api-design.mdx`:

````mdx
---
id: backend-rest-api-design
title: REST API 설계 기본
domain: backend
order: 1
prerequisites: []
estimatedMinutes: 18
difficulty: intermediate
tags:
  - api
  - rest
  - http
crossLinks:
  - foundations-html-parsing
  - frontend-rendering-pipeline
status: published
updatedAt: 2026-05-04
summary: 자원(Resource) 중심 URL·HTTP 메서드 의미·상태 코드·멱등성 — 처음 REST API 설계할 때 자주 부딪히는 결정 지점.
---

## 학습 목표

REST의 핵심 원칙(자원 중심, HTTP 메서드 의미, 상태 코드, 멱등성)을 이해하고 실무에서 흔한 설계 결정을 내릴 수 있다.

## 핵심 개념

REST(Representational State Transfer)는 HTTP 위에서 자원(Resource)을 중심으로 동작하는 API 스타일이다.

### 자원 중심 URL

- 자원은 **명사**, 행위는 **HTTP 메서드**로 표현
- ✅ `GET /users/42`, `POST /users`, `DELETE /users/42`
- ❌ `GET /getUser?id=42`, `POST /deleteUser`

### HTTP 메서드 의미

| 메서드   | 의미                             | 멱등?   | 안전? |
| -------- | -------------------------------- | ------- | ----- |
| `GET`    | 조회                             | ✅      | ✅    |
| `POST`   | 생성 (서버가 ID 부여)            | ❌      | ❌    |
| `PUT`    | 전체 교체 (클라이언트가 ID 지정) | ✅      | ❌    |
| `PATCH`  | 부분 수정                        | 보통 ✅ | ❌    |
| `DELETE` | 삭제                             | ✅      | ❌    |

- **멱등(Idempotent)**: 같은 요청을 여러 번 보내도 결과가 동일
- **안전(Safe)**: 서버 상태 변경 없음

### 상태 코드

| 코드                        | 의미                 | 흔한 케이스               |
| --------------------------- | -------------------- | ------------------------- |
| `200 OK`                    | 조회·수정 성공       | `GET`, `PUT`, `PATCH`     |
| `201 Created`               | 생성 성공            | `POST` 후 새 자원 응답    |
| `204 No Content`            | 성공했지만 본문 없음 | `DELETE`                  |
| `400 Bad Request`           | 클라이언트 입력 오류 | 유효성 실패               |
| `401 Unauthorized`          | 인증 안 됨           | 토큰 없음·만료            |
| `403 Forbidden`             | 권한 없음            | 인증은 됐지만 접근 권한 X |
| `404 Not Found`             | 자원 없음            | 잘못된 ID                 |
| `409 Conflict`              | 상태 충돌            | 중복 생성 시도            |
| `500 Internal Server Error` | 서버 오류            | 의도치 않은 예외          |

## 코드 예시

다음은 사용자 자원에 대한 표준 REST 엔드포인트.

```
GET    /users           # 목록 조회 (200)
GET    /users/42        # 단일 조회 (200, 없으면 404)
POST   /users           # 생성 (201, 응답에 새 id 포함)
PUT    /users/42        # 전체 교체 (200)
PATCH  /users/42        # 부분 수정 (200)
DELETE /users/42        # 삭제 (204)
```

POST 응답 예시:

```http
HTTP/1.1 201 Created
Location: /users/42
Content-Type: application/json

{
  "id": 42,
  "email": "user@example.com",
  "createdAt": "2026-05-04T10:00:00Z"
}
```

## 실무 시나리오

**케이스 1 — 결제 API에서 중복 결제 발생**

모바일 앱에서 결제 버튼 더블 탭, 또는 네트워크 재시도로 같은 결제가 두 번 처리됐다.

원인: `POST /payments`가 멱등하지 않음. 같은 요청 두 번 보내면 두 번 결제.

해결: **Idempotency-Key 헤더** 도입. 클라이언트가 UUID 생성해 헤더에 박음. 서버는 같은 키로 들어온 요청은 처음 결과를 그대로 응답(저장된 결과 재사용). Stripe·Toss 등 표준 패턴.

```http
POST /payments
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
```

**케이스 2 — 목록 조회가 점점 느려짐**

`GET /users` 응답이 데이터 누적되면서 5초 이상 걸린다.

원인: 페이지네이션 없음. 전체 row를 한 번에 응답.

해결: 쿼리 파라미터 `?page=1&limit=20` 또는 `?cursor=xxx&limit=20`. cursor 방식은 정확한 다음 페이지 보장(데이터 추가/삭제 시에도). 응답 헤더에 `Link: <...>; rel="next"` 또는 본문 `nextCursor` 포함.

## 분야 간 연결

- **foundations (HTTP)**: REST는 HTTP 위에서 동작 — 메서드·상태 코드·헤더가 HTTP 그대로
- **frontend**: React Query·SWR이 GET 멱등성을 활용해 자동 캐싱·재시도. PUT/DELETE는 자동 재시도 안 함
- **database**: 페이지네이션 시 cursor 방식은 인덱스 활용에 유리 (offset은 큰 페이지에서 느림)

## 자가 점검

### 개념 체크

- [ ] PUT과 PATCH의 차이를 설명할 수 있는가?
- [ ] 멱등성 정의와 어느 메서드가 멱등인지 말할 수 있는가?
- [ ] 401과 403의 차이를 설명할 수 있는가?

### 시나리오

**Q1.** 다음 중 더 적절한 설계는?

```
A) POST /users/42/deactivate
B) PATCH /users/42  body: { "status": "inactive" }
```

<details>
<summary>답 보기</summary>

**B가 REST 원칙에 더 부합**. A는 행위(`deactivate`)를 URL에 박은 RPC 스타일. B는 자원(`/users/42`)의 상태를 부분 수정.

단, A 스타일도 실무에서 자주 쓰임 — 복잡한 상태 전이(예: 결제 환불, 주문 배송 시작)는 의미 명확성을 위해 RPC 스타일이 더 읽기 쉬움. **순수 REST 원칙 vs 실용성** 사이 트레이드오프.

</details>

**Q2.** 사용자가 회원가입 API를 호출했는데 응답이 도착하기 전 네트워크 끊김. 다시 시도해도 안전한가?

<details>
<summary>답 보기</summary>

**그대로는 안전하지 않다**. POST는 멱등 X. 첫 요청이 서버에 도달했을 가능성이 있어 재시도 시 중복 가입 위험.

안전하게 만들려면 Idempotency-Key 헤더 도입. 클라이언트가 가입 시도 시 UUID 발급 → 재시도 시 같은 UUID로 보냄 → 서버는 같은 키로 이미 처리한 결과 응답.

</details>

## 자주 하는 오해

- ❌ "POST는 항상 생성, PUT은 항상 수정"
- ✅ POST는 _서버가 ID 부여_, PUT은 _클라이언트가 ID 지정_ — 그게 본질. 둘 다 생성·수정 모두 가능
- ❌ "DELETE 후 다시 DELETE 하면 에러"
- ✅ DELETE는 멱등. 두 번째 호출은 보통 `204` 또는 `404` (이미 없음). 둘 다 허용 — 핵심은 _상태가 같음_

## 참고 자료

- [REST — Wikipedia](https://en.wikipedia.org/wiki/REST)
- [HTTP semantics — RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Idempotency-Key — IETF Draft](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header)
- [Stripe API — Idempotent Requests](https://docs.stripe.com/api/idempotent_requests)
````

- [ ] **Step 2: 검증·커밋**

```bash
pnpm content:check && git add content/backend/ && git commit -m "content(backend): REST API 설계 기본 더미 노드"
```

---

## Task 14: database/01-relational-vs-nosql.mdx 작성

**Files:**

- Create: `content/database/01-relational-vs-nosql.mdx`

- [ ] **Step 1: 폴더 + 노드 작성**

```bash
mkdir -p content/database
```

`content/database/01-relational-vs-nosql.mdx`:

````mdx
---
id: database-relational-vs-nosql
title: 관계형 DB와 NoSQL — 언제 무엇을 쓰나
domain: database
order: 1
prerequisites: []
estimatedMinutes: 16
difficulty: intermediate
tags:
  - rdbms
  - nosql
  - schema
crossLinks:
  - backend-rest-api-design
status: published
updatedAt: 2026-05-04
summary: 관계형(스키마·트랜잭션·조인) vs NoSQL(스키마리스·수평 확장·다양한 모델)의 본질 차이와 실무 선택 기준.
---

## 학습 목표

관계형 DB와 NoSQL의 핵심 차이(데이터 모델·스키마·트랜잭션·확장)를 이해하고 신규 프로젝트에서 어떤 걸 선택할지 판단할 수 있다.

## 핵심 개념

### 관계형 DB (RDBMS, 예: PostgreSQL · MySQL)

- **데이터 모델**: 테이블(행·열)과 외래키로 표현된 _관계_
- **스키마**: 미리 정의 (CREATE TABLE), 변경 시 마이그레이션 필요
- **쿼리**: SQL — 표준화, JOIN으로 여러 테이블 결합
- **트랜잭션**: ACID 보장 (Atomicity·Consistency·Isolation·Durability)
- **확장**: 수직(서버 사양 ↑) 위주, 수평은 어려움(샤딩 복잡)

### NoSQL (예: MongoDB · DynamoDB · Redis · Cassandra)

NoSQL은 단일 카테고리 아님. 4가지 하위 모델:

| 모델      | 예시                 | 특징                      |
| --------- | -------------------- | ------------------------- |
| Document  | MongoDB              | JSON 형태 문서, 중첩 구조 |
| Key-Value | Redis · DynamoDB     | 단순 키 → 값, 매우 빠름   |
| Column    | Cassandra · BigQuery | 컬럼 단위 저장, 대량 분석 |
| Graph     | Neo4j                | 노드·엣지, 관계 탐색      |

공통 특징:

- **스키마**: 보통 유연 (필드 추가·변경 자유). 단, 검증을 앱 레벨에서 책임
- **트랜잭션**: 제한적 (단일 문서 ACID는 가능, 다중 문서는 복잡)
- **확장**: 수평 우선 — 샤딩이 처음부터 설계에 반영
- **쿼리**: 모델별 다름. SQL 표준 X

## 코드 예시

같은 데이터를 두 모델로 표현해보자.

**관계형 (PostgreSQL)**

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  title TEXT,
  body TEXT
);

-- 사용자의 글 목록
SELECT u.name, p.title
FROM users u
JOIN posts p ON p.user_id = u.id
WHERE u.id = 42;
```

**Document (MongoDB)**

```js
// users 컬렉션 — posts를 중첩
{
  _id: ObjectId("..."),
  email: "user@example.com",
  name: "Alice",
  posts: [
    { title: "Hello", body: "..." },
    { title: "World", body: "..." }
  ]
}

// 같은 조회 — JOIN 없음
db.users.findOne({ _id: ObjectId("...") })
```

문서형은 *읽기 쉬움 + 한 번 조회로 끝*이지만, 같은 user의 post를 여러 곳에서 참조하면 데이터 중복 문제 발생.

## 실무 시나리오

**케이스 1 — 신규 SaaS의 사용자·계정·청구 데이터**

스타트업이 SaaS 만든다. 사용자·팀·결제·구독 등 엔티티 간 관계가 많고 정합성이 중요(돈 관련).

선택: **관계형 (PostgreSQL)**. 이유:

- 외래키 + 트랜잭션으로 데이터 정합성 보장 (예: 결제 row 생성 ↔ 잔액 차감 동시 성공/실패)
- JOIN으로 "이 팀의 활성 사용자" 같은 쿼리 자연스러움
- Supabase·Neon 등 매니지드 PostgreSQL이 풍부

**케이스 2 — 글로벌 게임의 실시간 리더보드**

100만 동시 사용자, 매 초 점수 업데이트, 상위 N명 조회.

선택: **Redis (Sorted Set)**. 이유:

- `ZADD`·`ZRANGE`가 정확히 리더보드용 자료구조 제공 (O(log N))
- 메모리 기반, 매 초 쓰기·읽기에도 1ms 미만 응답
- 영속성은 보조 — 진짜 정답은 PostgreSQL에 저장하고 Redis는 핫 캐시

대부분 실무는 **혼합**. 정합성 필요한 쪽은 RDBMS, 핫·확장 필요한 쪽은 NoSQL.

## 분야 간 연결

- **backend (REST API)**: 관계형 DB는 자원 중심 URL과 자연스럽게 매핑(`/users/42` ↔ `users.id = 42`). NoSQL은 자원 경계가 모호할 수 있음
- **cloud**: 매니지드 RDBMS(RDS·Cloud SQL) vs 매니지드 NoSQL(DynamoDB·Firestore) 운영 비용 차이
- **cs (자료구조)**: 관계형 인덱스는 B-Tree, Redis Sorted Set은 Skip List, MongoDB는 B-Tree + 보조 인덱스 다양

## 자가 점검

### 개념 체크

- [ ] ACID 4글자가 각각 무엇인지 말할 수 있는가?
- [ ] NoSQL 4가지 모델(Document·Key-Value·Column·Graph) 차이를 한 줄씩 설명할 수 있는가?
- [ ] 수직 확장과 수평 확장의 차이를 설명할 수 있는가?

### 시나리오

**Q1.** 친구 추천 시스템 — "친구의 친구의 친구" 깊이 3까지 탐색해야 한다. 어떤 DB가 적합한가?

<details>
<summary>답 보기</summary>

**그래프 DB (Neo4j)**. 관계형 DB로도 가능하지만 깊이 N의 JOIN은 N이 커질수록 폭발적으로 느려짐. 그래프 DB는 노드 간 관계 탐색이 O(이웃 수)로 효율적.

소규모면 관계형도 충분 (recursive CTE). 대규모(SNS 등)에서는 그래프 DB가 정답.

</details>

**Q2.** 신규 서비스 시작 시 RDBMS와 NoSQL 중 무엇으로 시작해야 할까?

<details>
<summary>답 보기</summary>

**대부분의 경우 RDBMS (PostgreSQL)**. 이유:

- 초기엔 데이터 모델·접근 패턴이 불확실 — RDBMS의 유연한 쿼리(JOIN·WHERE)가 안전판
- 정합성 무료로 얻음 (NoSQL은 앱이 책임)
- 나중에 핫 캐시(Redis)·검색(Elasticsearch) 추가는 점진 가능

NoSQL부터 시작이 정답인 경우: (1) 스키마가 처음부터 명확하고 단순한 key-value, (2) 처음부터 100K+ TPS 예상, (3) 글로벌 멀티 리전 필수.

</details>

## 자주 하는 오해

- ❌ "NoSQL은 SQL 안 쓴다"
- ✅ NoSQL = "Not Only SQL". 일부 NoSQL(예: BigQuery)은 SQL 인터페이스 제공
- ❌ "관계형은 느리고 NoSQL은 빠르다"
- ✅ 워크로드별 다름. 단일 row 조회는 RDBMS가 마이크로초 단위로 끝남. NoSQL이 빠른 건 *수평 확장이 쉬워 더 큰 데이터를 분산 처리할 수 있다*는 뜻

## 참고 자료

- [PostgreSQL vs NoSQL — DigitalOcean](https://www.digitalocean.com/community/tutorials/sqlite-vs-mysql-vs-postgresql-a-comparison-of-relational-database-management-systems)
- [Designing Data-Intensive Applications — Martin Kleppmann (책)](https://dataintensive.net/)
- [MongoDB Data Modeling Patterns](https://www.mongodb.com/docs/manual/applications/data-models/)
- [Redis Data Types Tutorial](https://redis.io/docs/data-types/)
````

- [ ] **Step 2: 검증·커밋**

```bash
pnpm content:check && git add content/database/ && git commit -m "content(database): 관계형 vs NoSQL 더미 노드"
```

---

## Task 15: cloud/01-deploy-vs-host.mdx 작성

**Files:**

- Create: `content/cloud/01-deploy-vs-host.mdx`

- [ ] **Step 1: 폴더 + 노드 작성**

```bash
mkdir -p content/cloud
```

`content/cloud/01-deploy-vs-host.mdx`:

````mdx
---
id: cloud-deploy-vs-host
title: 배포(Deploy)와 호스팅(Hosting) — 같은 듯 다른 개념
domain: cloud
order: 1
prerequisites: []
estimatedMinutes: 12
difficulty: beginner
tags:
  - deployment
  - hosting
  - infrastructure
crossLinks:
  - backend-rest-api-design
status: published
updatedAt: 2026-05-04
summary: "배포"와 "호스팅"이 같은 말처럼 쓰이지만 다른 단계를 가리킨다 — 빌드·전송·실행·노출의 흐름을 분리해 이해한다.
---

## 학습 목표

배포(Deployment)와 호스팅(Hosting)이 가리키는 단계를 구분하고, 정적 사이트·서버리스·컨테이너·VM 별로 어디까지가 어디인지 파악한다.

## 핵심 개념

흔히 혼용되지만 둘은 다른 단계를 가리킨다.

- **빌드(Build)**: 소스 → 실행 가능한 산출물 (예: `next build`로 만든 정적 HTML + JS)
- **배포(Deploy)**: 빌드 산출물을 *서비스가 실행될 위치*로 전송
- **호스팅(Hosting)**: 그 위치에서 _지속적으로 서비스 제공_ (도메인 응답, 정적 파일 서빙, 함수 실행)

배포는 _순간의 액션_, 호스팅은 _지속되는 상태_.

### 호스팅 모델 4가지

| 모델          | 예시                                                 | 무엇을 호스팅?       |
| ------------- | ---------------------------------------------------- | -------------------- |
| 정적 호스팅   | Vercel(정적), Netlify, GitHub Pages, S3 + CloudFront | HTML·JS·CSS 파일     |
| 서버리스 함수 | Vercel Functions, AWS Lambda, Cloudflare Workers     | 요청당 실행되는 함수 |
| 컨테이너      | AWS ECS·Fargate, Cloud Run, Fly.io                   | Docker 이미지        |
| VM (전통)     | AWS EC2, GCP Compute Engine                          | 운영체제 + 우리 코드 |

위로 갈수록 _운영 부담 ↓ + 가격 ↓ + 제약 ↑_. 아래로 갈수록 _제약 ↓ + 운영 부담 ↑ + 가격 ↑_.

## 코드 예시

Next.js 프로젝트의 배포 흐름 (Vercel 기준).

```bash
# 로컬에서 (또는 CI에서)
git push origin main

# Vercel이 자동으로:
# 1. git에서 소스 가져옴 (clone)
# 2. pnpm install
# 3. pnpm build    ← 빌드 단계
# 4. 빌드 산출물을 Edge·CDN에 배포  ← 배포 단계
# 5. https://yourapp.com 응답  ← 호스팅 (지속)
```

같은 빌드 산출물을 다른 호스팅에 배포 가능:

```bash
# AWS S3로 정적 호스팅
pnpm build && pnpm export
aws s3 sync ./out s3://my-bucket --delete

# Docker 컨테이너로
docker build -t myapp .
docker push myrepo/myapp
# 이후 ECS·Cloud Run 등에서 컨테이너 실행
```

## 실무 시나리오

**케이스 1 — "왜 배포가 자꾸 깨지지?"**

매번 `git push` 후 사이트가 5분간 안 보인다. 배포 중에 504 Gateway Timeout 발생.

원인: 컨테이너 호스팅에서 _기존 컨테이너 종료 후 새 컨테이너 시작_ 시 다운타임 발생.

해결: **무중단 배포(Zero-downtime Deployment)** 기법. Blue-Green 또는 Rolling 업데이트.

- Blue-Green: 새 버전(Green)을 별도 환경에 띄운 뒤, 트래픽을 한 번에 Green으로 스위치
- Rolling: 인스턴스를 순차적으로 1개씩 새 버전으로 교체

매니지드 서비스(Vercel·Cloud Run)는 이걸 자동 처리. 직접 EC2 위에 띄우면 직접 구현 필요.

**케이스 2 — 트래픽이 적은데 매달 청구서가 큼**

사이드 프로젝트로 EC2 t3.medium 1대 띄워서 사용자 100명 받고 있다. 월 ~$30. 사용자는 하루 평균 50명.

원인: VM은 트래픽 0이어도 24시간 운영비 청구.

해결: 정적 호스팅 + 서버리스 함수 조합 (예: Vercel + Vercel Functions). 월 $0~$5. 함수는 호출당 과금이라 트래픽 적으면 거의 무료.

운영 비용 최적화에서 가장 빠른 효과 — 서버리스로 옮기는 것.

## 분야 간 연결

- **backend (REST API)**: 같은 API라도 호스팅 모델에 따라 콜드 스타트(Cold Start) 동작이 다름. 서버리스는 첫 요청에 지연(~100ms) 발생, 컨테이너·VM은 따뜻함
- **frontend**: 정적 호스팅은 CDN 엣지에서 응답 → 글로벌 사용자에게 빠름

## 자가 점검

### 개념 체크

- [ ] 빌드·배포·호스팅이 가리키는 단계를 구분해 설명할 수 있는가?
- [ ] 호스팅 4가지 모델(정적·서버리스·컨테이너·VM)의 운영 부담 순서를 말할 수 있는가?
- [ ] 무중단 배포가 필요한 이유를 설명할 수 있는가?

### 시나리오

**Q1.** Next.js 사이드 프로젝트를 월 비용 최저로 운영하려 한다. 무엇을 골라야 하나?

<details>
<summary>답 보기</summary>

**Vercel Hobby (무료) 또는 Cloudflare Pages**. 정적 페이지 + 서버리스 함수 모델로 트래픽 적으면 거의 무료. SSR/ISR이 필요하면 Vercel이 가장 매끄러움. 순수 정적이면 Cloudflare Pages도 강력.

EC2·VPS는 트래픽 0이어도 월 ~$5+. 사이드 프로젝트엔 적합 X.

</details>

**Q2.** 회사에서 운영하던 Node.js 서버를 EC2에서 Lambda(서버리스)로 옮기려 한다. 무엇을 먼저 검토해야 하나?

<details>
<summary>답 보기</summary>

**1. 콜드 스타트**: Lambda는 첫 호출에 ~100ms 지연. 사용자 인터랙티브 API라면 영향 큼. 해결책으로 Provisioned Concurrency(상시 워밍, 추가 비용).
**2. 실행 시간 제한**: Lambda는 최대 15분. 장기 실행 작업은 Step Functions·SQS로 분할 필요.
**3. 메모리·동시 실행 제한**: 단일 Lambda는 최대 10GB 메모리, 계정 동시 실행 1000개 (요청 시 증가).
**4. 패키지 크기**: Lambda 압축 후 50MB·압축 해제 250MB 제한. 큰 라이브러리는 Lambda Layers로 분리.

이 4개 통과하면 비용·운영 모두 큰 이득.

</details>

## 자주 하는 오해

- ❌ "서버리스는 서버가 없다"
- ✅ 서버는 있음. 다만 _우리가 관리하지 않음_. 운영 책임이 클라우드 제공자에게 위임됐을 뿐
- ❌ "정적 호스팅은 동적 기능을 못 한다"
- ✅ 정적 호스팅 + 서버리스 함수 조합으로 동적 기능 가능 (예: Vercel + Vercel Functions). JAMstack 패턴

## 참고 자료

- [Hosting Web Apps — MDN](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work)
- [Vercel — Deployment Concepts](https://vercel.com/docs/deployments/overview)
- [AWS — Compute Services 비교](https://aws.amazon.com/products/compute/)
- [JAMstack](https://jamstack.org/)
````

- [ ] **Step 2: 검증·커밋**

```bash
pnpm content:check && git add content/cloud/ && git commit -m "content(cloud): 배포 vs 호스팅 더미 노드"
```

---

## Task 16: cs/01-time-complexity.mdx 작성

**Files:**

- Create: `content/cs/01-time-complexity.mdx`

- [ ] **Step 1: 폴더 + 노드 작성**

```bash
mkdir -p content/cs
```

`content/cs/01-time-complexity.mdx`:

````mdx
---
id: cs-time-complexity
title: 시간 복잡도(Big-O) 빠르게 읽기
domain: cs
order: 1
prerequisites: []
estimatedMinutes: 14
difficulty: beginner
tags:
  - algorithm
  - complexity
crossLinks:
  - frontend-rendering-pipeline
  - database-relational-vs-nosql
status: published
updatedAt: 2026-05-04
summary: 알고리즘 비용을 입력 크기 N에 대한 함수로 표현하는 Big-O 표기법 — O(1) · O(log N) · O(N) · O(N log N) · O(N²)을 코드로 구분.
---

## 학습 목표

코드를 보고 시간 복잡도를 어림잡을 수 있고, 흔한 자료구조 연산의 복잡도를 외우고 있다.

## 핵심 개념

시간 복잡도(Time Complexity)는 *입력 크기 N에 대해 알고리즘 실행 횟수가 어떻게 늘어나는가*를 표현한다.

흔한 등급 (작을수록 빠름):

| Big-O      | 이름      | N=1000일 때 대략 |
| ---------- | --------- | ---------------- |
| O(1)       | 상수      | 1번              |
| O(log N)   | 로그      | 10번             |
| O(N)       | 선형      | 1,000번          |
| O(N log N) | 선형 로그 | 10,000번         |
| O(N²)      | 이차      | 1,000,000번      |
| O(2^N)     | 지수      | 천문학적         |

핵심 직관:

- *반복 1번*은 O(N)
- *이중 반복*은 O(N²)
- *반씩 줄여가며 탐색*은 O(log N)
- _정렬은 보통_ O(N log N)

## 코드 예시

```js
// O(1) — 입력 크기 무관, 항상 같은 시간
function getFirst(arr) {
  return arr[0];
}

// O(N) — 한 번 순회
function sum(arr) {
  let s = 0;
  for (const x of arr) s += x;
  return s;
}

// O(N²) — 이중 순회
function hasDuplicate(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// O(N) — Set 활용으로 위 함수 개선
function hasDuplicateFast(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}

// O(log N) — 이진 탐색
function binarySearch(sortedArr, target) {
  let lo = 0,
    hi = sortedArr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (sortedArr[mid] === target) return mid;
    if (sortedArr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

### 자료구조 연산 복잡도 (외워두면 유용)

| 자료구조           | 조회                           | 삽입             | 삭제        |
| ------------------ | ------------------------------ | ---------------- | ----------- |
| 배열 (Array)       | O(1) (인덱스) / O(N) (값 검색) | O(N) (중간 삽입) | O(N)        |
| 해시맵 (Map·Set)   | O(1)                           | O(1)             | O(1)        |
| 정렬된 배열        | O(log N) (이진 탐색)           | O(N)             | O(N)        |
| B-Tree (DB 인덱스) | O(log N)                       | O(log N)         | O(log N)    |
| 연결 리스트        | O(N)                           | O(1) (head)      | O(1) (head) |

## 실무 시나리오

**케이스 1 — 사용자 목록 검색이 점점 느려짐**

`/users?search=alice` API가 사용자 10만명 넘어가면서 5초 이상 걸린다.

원인: 백엔드에서 `users.filter(u => u.name.includes(search))` 식으로 전체 순회. O(N).

해결:

- 일부 필드로 검색하면 DB 인덱스 (B-Tree, O(log N) → ms 단위)
- 전문 검색은 별도 검색 엔진 (Elasticsearch 등)
- 자주 쓰는 검색어는 Redis 캐시 (O(1))

**케이스 2 — 프론트엔드 리스트 렌더링이 느림**

사용자 1000명 리스트 + 각 항목 옆에 친구 여부 표시. `friends.includes(user.id)` 매번 호출 → 화면이 1초간 멈춤.

원인: `friends`가 배열이라 `includes`는 O(N). 사용자 1000명 × 친구 검색 1000번 = 100만 비교 = O(N²).

해결: `const friendSet = new Set(friends)` 미리 만들고 `friendSet.has(user.id)`. O(N) → O(N) (이중 반복 → 단일 + Set 조회).

```js
// Before — O(N²)
users.map((u) => ({ ...u, isFriend: friends.includes(u.id) }));

// After — O(N)
const friendSet = new Set(friends);
users.map((u) => ({ ...u, isFriend: friendSet.has(u.id) }));
```

## 분야 간 연결

- **frontend**: 리스트 렌더링·필터링에서 O(N²) 함정이 흔함. Set/Map 활용으로 O(N)으로 개선 가능
- **database**: 인덱스 없는 컬럼 조회는 O(N) 풀스캔. B-Tree 인덱스가 O(log N) 보장
- **backend**: 페이지네이션 cursor 방식은 O(log N) 인덱스 탐색, offset 방식은 큰 페이지에서 O(N)

## 자가 점검

### 개념 체크

- [ ] O(1)·O(log N)·O(N)·O(N log N)·O(N²)을 빠른 순서대로 나열할 수 있는가?
- [ ] 해시맵의 평균 조회 복잡도와 그 이유를 설명할 수 있는가?
- [ ] 이중 반복문이 어떤 경우 O(N²)이 아니라 O(N)인지 예를 들 수 있는가?

### 시나리오

**Q1.** 다음 두 코드의 시간 복잡도는?

```js
// A
for (let i = 0; i < N; i++) {
  for (let j = 0; j < i; j++) {
    console.log(i, j);
  }
}

// B
for (let i = 0; i < N; i++) {
  for (let j = 0; j < 10; j++) {
    console.log(i, j);
  }
}
```

<details>
<summary>답 보기</summary>

**A: O(N²)** — 안쪽 루프가 평균 N/2번 → 전체 N × N/2 = O(N²).
**B: O(N)** — 안쪽 루프가 항상 10번 (상수). N × 10 = O(N).

이중 반복문이 보인다고 무조건 O(N²)이 아님. *안쪽이 N에 비례하는지*가 핵심.

</details>

**Q2.** 1억개 정수 배열에서 특정 값을 찾으려 한다. 정렬되지 않은 경우와 정렬된 경우 각각 무엇을 쓰나?

<details>
<summary>답 보기</summary>

**정렬되지 않음**: 선형 탐색 O(N) — 첫 발견 시까지 순회. 평균 N/2 = 5천만 비교.
**정렬됨**: 이진 탐색 O(log N) — log₂(1억) ≈ 27 비교.

5천만 vs 27. 약 200만 배 차이. 정렬은 한 번 들이는 비용 O(N log N)이지만, 검색을 여러 번 한다면 압도적으로 이득.

</details>

## 자주 하는 오해

- ❌ "Big-O는 코드의 절대 실행 시간을 말한다"
- ✅ Big-O는 *입력이 커질수록 어떻게 늘어나는가*를 말한다. 작은 N에서는 O(N²)가 O(N log N)보다 빠를 수도 있음(상수 항이 더 작아서)
- ❌ "해시맵은 항상 O(1)"
- ✅ 평균 O(1). 최악(해시 충돌 많을 때)은 O(N)까지 갈 수 있음. 실무에선 거의 평균이지만 보안(해시 충돌 공격) 맥락에서는 주의

## 참고 자료

- [Big O Cheat Sheet](https://www.bigocheatsheet.com/)
- [Time Complexity — MDN](https://developer.mozilla.org/en-US/docs/Glossary/Big_O_notation)
- [Algorithms (Princeton, Coursera)](https://www.coursera.org/learn/algorithms-part1)
- [Introduction to Algorithms — CLRS (책)](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/)
````

- [ ] **Step 2: 검증·커밋**

```bash
pnpm content:check && git add content/cs/ && git commit -m "content(cs): 시간 복잡도 더미 노드"
```

---

## Task 17: 최종 검증 + PR

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 CI 시퀀스 로컬 실행**

Run:

```bash
pnpm typecheck && pnpm lint && pnpm content:check && pnpm build
```

Expected:

- typecheck: exit 0
- lint: exit 0
- content:check: 6개 노드 검증 통과 (foundations·frontend·backend·database·cloud·cs 각 1)
- build: SSG 출력에 6개 도메인 인덱스 + 6개 노드 페이지 모두 prerender

- [ ] **Step 2: prod 빌드 출력 확인**

빌드 출력에서 다음 라우트가 모두 보여야 함:

```
├ ● /learn/[domain]
│ ├ /learn/foundations
│ ├ /learn/frontend
│ ├ /learn/backend
│ ├ /learn/database
│ ├ /learn/cloud
│ └ /learn/cs
└ ● /learn/[domain]/[slug]
  ├ /learn/foundations/html-parsing
  ├ /learn/frontend/rendering-pipeline
  ├ /learn/backend/rest-api-design
  ├ /learn/database/relational-vs-nosql
  ├ /learn/cloud/deploy-vs-host
  └ /learn/cs/time-complexity
```

- [ ] **Step 3: dev 서버 sanity check (선택, 이미 실행 중이면 hot reload)**

브라우저로 다음 경로 직접 확인:

- http://localhost:3000/learn/foundations — 노드 1개 표시
- http://localhost:3000/learn/foundations/html-parsing — 9 섹션 + 푸터 안내
- http://localhost:3000/learn/cloud — 노드 1개 표시
- http://localhost:3000/learn/존재안함 → 404

- [ ] **Step 4: 푸시**

Run:

```bash
git push -u origin feat/product-pivot-cross-domain
```

- [ ] **Step 5: PR 생성**

Run:

```bash
gh pr create --title "feat: 제품 피벗 — cross-domain 큐레이션 학습 노트 (6 도메인 + 9 섹션 + 더미 6)" --body "$(cat <<'EOF'
## Summary

valleyofdespair를 FE 깊이·본인 경험 중심에서 cross-domain 큐레이션 학습 노트로 피벗.

### 변경 요약
- **도메인**: 8개(rendering/state/.../side-*) → 6개(foundations/frontend/backend/database/cloud/cs)
- **차별화**: 본인 실무 경험 40% → 4 기둥 동등(연결·쉬움·실무·검증)
- **합성 비중**: 외부 30+LLM 30+본인 40 → 외부 50+LLM 40+큐레이션 10
- **본인 1인칭 0%** — 큐레이션 모델로 전환

### 구체 산출물
- `src/lib/content/schema.ts` 도메인 enum + 메타 6개로 교체
- 노드 페이지 푸터에 큐레이션 안내 1줄 추가
- 더미 노드 6개 (각 도메인 1개씩, 9 섹션 표준)
- ADR 0010 추가 (피벗 결정 기록)
- PRODUCT/CONTENT_SCHEMA/STACK/ROADMAP/CONVENTIONS/CLAUDE 일괄 갱신
- spec/plan 두 문서를 `docs/superpowers/` 아래에 작성

## Test plan
- [ ] CI 4단계 모두 그린 (typecheck · lint · content · build)
- [ ] Vercel preview에서 6개 도메인 페이지 + 6개 노드 페이지 정상 렌더
- [ ] 노드 페이지 푸터에 큐레이션 안내 1줄 노출
- [ ] 자가 점검 섹션의 `<details>` 펼치기 동작
- [ ] 미존재 도메인·slug 접근 시 404

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: PR URL 확인**

PR URL을 사용자에게 전달하고, CI 그린 + 본인 검토 후 머지 진행.

---

## Self-Review

### Spec coverage

- ✅ Q1 (4 기둥): Task 4(PRODUCT.md)·5(CONTENT_SCHEMA.md)에 4 기둥 명시, Task 11~16 더미 노드에 5·6·7·8 섹션으로 반영
- ✅ Q2 (6 도메인): Task 1(schema)·2(파일 이동)·12~16(새 도메인 폴더 + 노드)
- ✅ Q3 (9 섹션): Task 5에 표 정의, Task 11~16에 실제 적용
- ✅ Q4 (체크리스트+시나리오): Task 5에 마크다운 패턴, Task 11~16 모든 노드에 두 형식 모두
- ✅ Q5 (본문+사이드바/인덱스): Task 5에 분야 간 연결 섹션 정의, Task 11~16에 적용. 사이드바 표시는 3주차 작업이므로 비범위
- ✅ Q6 (짧은 슬러그): Task 1 schema에 적용
- ✅ Q7 (작은 양 — 더미 6 / MVP 30~40 / 장기 60~80): Task 4(PRODUCT.md)·7(ROADMAP.md)에 반영
- ✅ Q8 (무인칭 + 큐레이션 푸터): Task 3 페이지 푸터, Task 8(CONVENTIONS.md) 톤 명시, Task 11~16 더미 모두 무인칭 평어

### Placeholder scan

- 모든 Task에 실제 코드/마크다운/명령어 포함. "TBD"·"TODO"·"implement later" 없음
- 더미 노드 본문은 모두 실제 작성됨 (Task 11~16)

### Type consistency

- `Domain` 타입은 Task 1에서 단일 정의 → 다른 Task에서 사용하지 않으므로 타입 재사용 충돌 없음
- 도메인 슬러그(`foundations`, `frontend`, ...)는 Task 1·2·5·6·12~16에서 일관 사용

### 실행 순서 의존성

- Task 1 → 2 (schema 먼저, 이후 콘텐츠 이동)
- Task 1 → 3 (schema 변경이 빌드 영향)
- Task 2 → 11 (이동 먼저, 본문 재작성은 그 다음)
- Task 4~9 (문서들)는 서로 독립, 어느 순서로든 가능
- Task 10 (ADR)은 다른 모든 Task와 독립
- Task 12~16 (새 더미 노드)은 Task 1 이후 어느 시점에서도 가능, 순서 무관
- Task 17은 모든 앞 Task 완료 후

### PR 묶음 권장

- PR-A: Task 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (인프라+문서+ADR — 코드 큰 변경 없음, 문서 위주)
- PR-B: Task 11~16 (콘텐츠 6개 — 큰 분량이지만 자기완결)

또는 단일 PR (모든 Task 한 번에). 변경량 크지만 피벗이 한 호흡에 끝나는 장점.
