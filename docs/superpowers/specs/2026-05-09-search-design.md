# 2026-05-09 — 검색 기능 설계 (4주차 A 묶음)

## 배경

ROADMAP 4주차의 첫 묶음. 사용자가 노드 60~80개 안에서 키워드로 빠르게 도착할 수 있는 검색 진입점을 박는다. 원래 ROADMAP은 Pagefind를 명시했으나, 3주차에 노드 페이지(`[domain]/[slug]`)가 cookies 사용으로 dynamic 라우트가 되면서 Pagefind의 정적 HTML 크롤링 전제가 깨졌다. 이 spec은 자체 인덱싱(content/\*.mdx 직접 읽기)으로 노선을 변경한다.

## 결정 사항 (브레인스토밍 결과)

| Q   | 결정                                              | 메모                                                           |
| --- | ------------------------------------------------- | -------------------------------------------------------------- |
| Q1  | 인덱싱 = content/\*.mdx 직접 (Pagefind 미사용)    | dynamic 라우트와 무관, 60~80 노드면 인덱스 가벼움              |
| Q2  | 인덱스 범위 = 본문 전체                           | 학습 노트라 본문 키워드 검색이 핵심 (개념·API 이름 등)         |
| Q3  | 진입 = 헤더 검색 아이콘 + Cmd+K (윈도우는 Ctrl+K) | 데스크톱 단축키 + 모바일·터치 1탭                              |
| Q4  | 빈 상태 = 도메인당 1개씩 추천 6개                 | 첫 인상 깔끔, 비로그인/로그인 분기 X, 도메인 디스커버리 겸함   |
| Q5  | 결과 표시 = 단일 리스트 + 도메인 라벨             | 노드 60~80, 결과 보통 ≤10개 — 필터·그룹화 가치 낮음            |
| Q6  | 한국어 토큰화 = 2-글자 n-gram                     | 부분 검색 ("렌더"→"렌더링" 매칭) 필수, 인덱스 크기 ~2배는 허용 |

## 라이브러리 선택

**MiniSearch** (`minisearch`, MIT, ~10KB gzipped).

- prefix·fuzzy·필드 boost 다 지원
- 토크나이저·process term 함수 커스터마이즈 가능 (한국어 n-gram에 필요)
- 인덱스 직렬화·역직렬화 지원 (빌드 시점 인덱스 생성 → 클라이언트 로드)

거절된 대안:

| 대안         | 거절 이유                                              |
| ------------ | ------------------------------------------------------ |
| Pagefind     | dynamic 노드 페이지 인덱싱 불가 (이번 spec의 발단)     |
| Fuse.js      | fuzzy 강하지만 인덱스 사전 구축 비용 ↑, 노드 늘면 느림 |
| FlexSearch   | 빠르고 작지만 한글 토크나이저 커스터마이즈 어려움      |
| Algolia·외부 | 운영 의존성·비용·키 노출 — MVP 과잉                    |

## 데이터 흐름

```
[빌드 시점]
  scripts/build-search-index.ts
    ├─ content/*/*.mdx 전부 읽고 frontmatter + body 분리
    ├─ status: 'published'만 필터
    ├─ MiniSearch 인덱스 생성 (n-gram 토크나이저)
    ├─ doc 본문은 인덱스에 포함 (search snippet 추출용)
    └─ JSON 직렬화 → public/search-index.json

  package.json scripts.postbuild = build-search-index.ts 실행
  (next build 후, content:check은 prebuild 그대로)

[런타임]
  헤더 검색 아이콘 또는 Cmd+K
    └─ SearchDialog mount (shadcn Command)
         ├─ 첫 mount 시 fetch('/search-index.json') (lazy)
         ├─ MiniSearch.loadJSON으로 client 인스턴스 복원
         ├─ 캐싱: useState로 한 번만 load, 모달 재열기 시 재사용
         └─ 입력 onChange → search() → 결과 렌더
```

## 컴포넌트 구조

### 신규 파일

```
scripts/
  build-search-index.ts          # 빌드 시점 인덱스 생성 + JSON 출력

src/components/search/
  search-dialog.tsx              # shadcn Command 모달 + 인덱스 lazy load + 검색
  search-trigger.tsx             # 헤더 아이콘 버튼 (모달 토글)
  search-result-item.tsx         # 결과 1개 카드 (도메인 라벨 + 제목 + snippet)
  search-empty-state.tsx         # 빈 상태 (도메인당 1개 추천 6개)
  use-cmdk.ts                    # Cmd+K / Ctrl+K 단축키 훅

src/lib/search/
  index.ts                       # MiniSearch 설정·생성·load 함수 (서버·클라 공통)
  tokenize.ts                    # 한국어 2-글자 n-gram 토크나이저

public/
  search-index.json              # 빌드 산출물 (gitignore 추가)
```

### 수정 파일

```
src/components/layout/site-header.tsx
  검색 아이콘 버튼 추가 + SearchDialog mount

package.json
  postbuild script 추가
  minisearch dependency 추가

.gitignore
  public/search-index.json 무시

docs/ROADMAP.md
  Pagefind → MiniSearch 표기 변경
  4주차 A 항목 [x] 마크 (구현 후)

CLAUDE.md
  "거부된 대안"에 Pagefind는 안 들어감 (사용자 결정으로 변경)
  현재 진행 상황 갱신 (구현 후)
```

## UX 동작

### 진입

- **데스크톱**: `Cmd+K` (macOS) / `Ctrl+K` (Windows·Linux) 입력 시 모달 열림
- **모든 환경**: 헤더 우측 검색 아이콘 클릭 → 모달 열림
- 모달 열리면 input 자동 focus

### 빈 상태 (검색어 0자)

- 6개 도메인의 `order: 1` 노드 (또는 도메인 첫 노드)를 카드로 표시
- 카드 클릭 시 노드 페이지로 이동 + 모달 닫힘

### 검색어 1자 이상

- onChange로 즉시 search 호출 (debounce 없음 — MiniSearch 빠름)
- 결과 max 10개, score 정렬
- 각 결과: `[도메인 라벨] · 제목` + 본문 일부 snippet (matched 부분 강조 — `<mark>` 태그)
- 결과 없으면 "검색 결과 없음"

### 키보드

- `↑↓`: 결과 항목 focus 이동
- `Enter`: 선택 결과 노드로 이동 + 모달 닫기
- `Esc`: 모달 닫기

shadcn `Command`(CMDK 기반)이 위 동작을 거의 다 내장.

## 인덱스 schema

MiniSearch 설정:

```typescript
{
  fields: ['title', 'summary', 'tags', 'body'],
  storeFields: ['id', 'domain', 'slug', 'title', 'summary', 'body'],
  searchOptions: {
    boost: { title: 3, summary: 2, tags: 2, body: 1 },
    prefix: true,
    fuzzy: 0.1,
  },
  tokenize: koreanNgramTokenize,  // 2-글자 n-gram + 영문 단어
  processTerm: (term) => term.toLowerCase().trim() || null,
}
```

문서 1개:

```typescript
{
  id: 'foundations-html-parsing',     // frontmatter.id
  domain: 'foundations',
  slug: 'html-parsing',
  title: 'HTML 파싱과 DOM 구성',
  summary: '브라우저가 ...',
  tags: ['browser', 'dom'],
  body: '...전체 mdx 본문...',
}
```

## 한국어 n-gram 토크나이저

```typescript
function koreanNgramTokenize(text: string): string[] {
  const tokens: string[] = [];
  const words = text.split(/[\s,.​]+/);
  for (const word of words) {
    if (/^[a-zA-Z0-9_-]+$/.test(word)) {
      tokens.push(word);
      continue;
    }
    for (let i = 0; i < word.length - 1; i++) {
      tokens.push(word.slice(i, i + 2));
    }
    if (word.length === 1) tokens.push(word);
  }
  return tokens;
}
```

- 영문·숫자·기호만 있는 단어는 그대로 (불필요한 분할 X)
- 한글·혼합 단어는 2-글자 슬라이딩 윈도우
- 검색 시에도 동일 함수 적용 → 동일 매칭 보장

## 리스크 / 대안

### 리스크

1. **인덱스 크기** — 노드 60~80개 × 평균 본문 5KB + n-gram 인덱스 = ~1~2MB. 첫 검색 시 1회 다운로드. 캐시 후 재방문 시 0KB. 모바일 3G에선 1~2초 부담 가능.
2. **빌드 시점 의존** — content/\*.mdx 추가·수정 후 재빌드해야 인덱스 갱신. 정적 사이트라 자연스러움.
3. **n-gram 정확도 한계** — "리액트 훅"을 검색하면 "리액"·"액트"·"트 "·"훅" 매칭 → noisy 결과 가능. boost와 prefix로 정렬되지만 조사 변형은 어려움. MVP 허용.
4. **MiniSearch 직렬화 사이즈** — JSON으로 인덱스 그대로 저장하면 크기 ↑. brotli 압축은 Vercel CDN이 자동 처리.

### 거절된 대안

| 대안                             | 거절 이유                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| 검색 결과 fuzzy weight 높임      | 노이즈 증가, 정확 매칭 우선 정책에 어긋남                                                    |
| 결과 클릭 시 same-tab vs new-tab | 학습 흐름은 same-tab이 자연스러움, new-tab은 옵션 X                                          |
| 검색 도메인 필터 토글            | 결과 ≤10개에선 가치 낮음 (Q5 결정)                                                           |
| 최근 본 노드 fallback            | localStorage 금지, Supabase progress 기반은 비로그인 미작동 → 단순 추천 6개로 통일 (Q4 결정) |
| Cmd+K + 다른 단축키 추가         | YAGNI                                                                                        |

## 작업 단위 (writing-plans 입력 예고)

1. `minisearch` 설치 + `.gitignore` 갱신 (`public/search-index.json`)
2. `scripts/build-search-index.ts` — content 읽기 + 인덱스 생성 + JSON 출력
3. `package.json` — `postbuild` script 추가
4. `src/lib/search/tokenize.ts` — 한국어 n-gram 함수
5. `src/lib/search/index.ts` — MiniSearch 설정·load 함수
6. `src/components/search/search-result-item.tsx` — 결과 카드
7. `src/components/search/search-empty-state.tsx` — 빈 상태 6개
8. `src/components/search/use-cmdk.ts` — 단축키 훅
9. `src/components/search/search-dialog.tsx` — 모달 + lazy load + search
10. `src/components/search/search-trigger.tsx` — 헤더 아이콘 버튼
11. `src/components/layout/site-header.tsx` — 트리거 wire
12. `docs/ROADMAP.md` Pagefind → MiniSearch 갱신 + 4주차 A 항목 체크
13. `CLAUDE.md` 진행 상황 갱신
14. PR 생성

## 완료 기준

- 데스크톱 Cmd+K → 모달 열림 + 빈 상태 6개 노드
- 검색어 입력 → 즉시 결과 (한국어 부분 매칭 동작)
- 결과 Enter → 노드 페이지 이동 + 모달 닫힘
- 헤더 검색 아이콘 클릭 동일 동작
- 모바일에서 헤더 아이콘 1탭 진입
- prod 배포 후 동일 시나리오 통과
- 인덱스 파일 크기 1.5MB 이하 (브라우저 첫 로드 부담 ↓)
