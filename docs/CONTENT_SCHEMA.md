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
