# 2026-05-05 — 사이드바 트리 + 진척도 설계

## 배경

ROADMAP 3주차 항목. 인프라(`shadcn Sidebar`, `SidebarProvider`, Supabase `progress` 테이블 + RLS, `@tanstack/react-query`, `@supabase/ssr`)는 1~2주차에 모두 깔렸다. 현재 `<AppSidebar />`는 빈 껍데기로 layout에 박혀있고, `progress` 테이블은 비어있다. 이 문서는 사이드바 콘텐츠와 진척도 동작을 정의해 3주차 작업 범위를 박는다.

### 목표 (ROADMAP 3주차 완료 기준)

> 로그인 후 진척도 표시·토글이 사이드바에 즉시 반영

부수 요구:

- 모바일 햄버거 메뉴 (shadcn `Sidebar` 내장 sheet 사용)
- 키보드 네비 (Tab + 화살표 ↑↓)
- 비로그인 시 사이드바는 노출하되 진척도 영역 제거 + 로그인 유도

## 결정 사항 (브레인스토밍 결과)

| Q   | 결정                                                                 | 메모                                            |
| --- | -------------------------------------------------------------------- | ----------------------------------------------- |
| Q1  | `reading` 트리거 = 자동 + 5초 임계값                                 | 잠깐 둘러본 노드 노이즈 차단                    |
| Q2  | `completed` 트리거 = 명시 클릭 ("다 읽었음" 버튼)                    | 자가 점검 풀고 사용자가 "끝냈음" 명시           |
| Q3  | 비로그인 사이드바 = 노드 목록 그대로 + 진척도 영역 제거              | 학습 트리 탐색은 비로그인도 가능                |
| Q4  | `node_slug` = frontmatter `id` (`foundations-html-parsing`)          | id는 stable 키 컨벤션, 도메인 충돌 없음         |
| Q5  | RPC 함수로 reading 무회귀 보장 (`INSERT ... ON CONFLICT DO NOTHING`) | client query race로 completed→reading 회귀 차단 |
| Q6  | Page Visibility 처리                                                 | 백그라운드 탭 누적 시간 제외                    |
| Q7  | 진척도 SSR prefetch (`HydrationBoundary`)                            | 첫 페인트 인디케이터 깜빡임 방지                |
| Q8  | 도메인 펼침 상태 = 매 세션 reset (현재 도메인만 자동 펼침)           | localStorage 금지, URL state 비도입             |
| Q9  | 화살표 네비 = 사이드바 focus 안일 때만                               | 본문 페이지 스크롤과 충돌 차단                  |
| Q10 | 비로그인 노드 페이지 "다 읽었음" 버튼 = 숨김                         | 비활성+툴팁 대비 단순함                         |

## 데이터 모델

### `progress` 테이블 (기존 — `0001_progress.sql`)

```sql
create type public.progress_status as enum ('reading', 'completed');

create table public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_slug text not null,         -- frontmatter id
  status public.progress_status not null default 'reading',
  updated_at timestamptz not null default now(),
  primary key (user_id, node_slug)
);
```

`unread`는 행 부재로 표현. enum 2개로 충분.

### RPC `mark_reading(p_slug text)` (신규 — `0002_progress_rpc.sql`)

```sql
create or replace function public.mark_reading(p_slug text)
returns void
language sql
security invoker          -- RLS 적용 유지
as $$
  insert into public.progress (user_id, node_slug, status)
  values (auth.uid(), p_slug, 'reading')
  on conflict (user_id, node_slug) do nothing;
$$;
```

핵심: `do nothing` — 이미 `reading`/`completed` 행이 있으면 무시. completed 회귀 불가능.

`completed`는 별도 RPC 불필요 — 표준 `update`로 처리 (사용자가 명시적으로 누른 경우라 회귀 의도 가능):

```ts
await supabase.from('progress').upsert({ user_id, node_slug, status: 'completed' });
```

### query 키

```
['progress']                      // 전체 fetch (RLS로 자기 것만)
```

`node_slug` 단위 query는 N개 노드마다 fetch 하지 않도록 단일 query로 묶고 client에서 인덱싱.

## 컴포넌트 구조

### 신규 파일

```
src/lib/supabase/
  progress.ts              # fetcher·mutation 함수 (서버/클라 양쪽 사용 가능)
src/lib/hooks/
  use-progress.ts          # useProgress·useMarkReading·useMarkCompleted
src/components/sidebar/
  node-tree.tsx            # 도메인 그룹 + 노드 link (클라이언트, 펼침 상태)
  progress-indicator.tsx   # ○◐● 아이콘 (클라이언트, useProgress 구독)
  sidebar-keyboard-nav.tsx # 화살표 ↑↓ 핸들러 훅
  login-prompt.tsx         # 비로그인 시 푸터 로그인 버튼
src/components/learn/
  mark-reading.tsx         # 5초 + visibility 트리거 (노드 페이지 mount)
  mark-completed.tsx       # "다 읽었음" 버튼 (노드 페이지 본문 하단)
supabase/migrations/
  0002_progress_rpc.sql    # mark_reading RPC
```

### 수정 파일

```
src/components/layout/app-sidebar.tsx
  서버 컴포넌트로 노드 목록 SSR + 진척도 prefetch + HydrationBoundary로 wrap
src/app/learn/[domain]/[slug]/page.tsx
  <MarkReading slug={...} /> mount + 본문 하단 <MarkCompleted slug={...} /> 추가
```

## 동작 흐름

### 1. `reading` 트리거 (5초 + visibility)

```
[노드 페이지 mount]
  ├─ MarkReading 컴포넌트가 visible 시간 누적 시작
  ├─ visibilitychange 이벤트로 hidden 시 일시정지, visible 시 재개
  ├─ 누적 5초 도달 → supabase.rpc('mark_reading', { p_slug: id })
  ├─ RPC가 ON CONFLICT DO NOTHING → 이미 reading/completed면 무시
  └─ 성공 시 React Query setQueryData(['progress'], ...) 낙관적 갱신
```

비로그인 시 `MarkReading`은 mount되지만 auth state 확인 후 트리거 자체를 skip.

### 2. `completed` 트리거 (명시 클릭)

```
[사용자가 "다 읽었음" 버튼 클릭]
  ├─ useMarkCompleted mutation 실행
  ├─ optimistic: setQueryData(['progress'], prev → status='completed')
  ├─ supabase.from('progress').upsert({ status: 'completed' })
  ├─ 실패 시 onError → 이전 캐시로 rollback + 토스트
  └─ 사이드바 인디케이터·버튼 라벨 즉시 반영
```

비로그인: `MarkCompleted` 컴포넌트가 auth state 보고 자체 unmount (DOM에서 사라짐).

### 3. 사이드바 인디케이터

```
[페이지 mount]
  ├─ AppSidebar (서버) — listPublishedNodes() + getProgress() 동시 fetch
  ├─ HydrationBoundary로 ['progress'] 캐시 hydrate
  └─ <ProgressIndicator slug={id} /> — useProgress 훅이 hydrate된 캐시에서 즉시 인덱싱
       ○ unread (행 없음)
       ◐ reading
       ● completed
```

비로그인: getProgress가 빈 배열 반환, 인디케이터 렌더 단계에서 인증 상태 확인하면 아이콘 자체 미렌더.

### 4. 도메인 펼침/접기

- `node-tree.tsx`가 클라이언트 컴포넌트, `useState`로 펼침 set 관리
- 초기 상태: `usePathname()`에서 현재 도메인 추출, 그것만 펼침
- 사용자 클릭으로 set 갱신 가능
- 페이지 이동 시 reset 동작: `useEffect(() => setExpanded(new Set([currentDomain])), [currentDomain])` — 도메인이 바뀌면 펼침 set을 새 도메인 1개로 초기화. 같은 도메인 안 노드 이동에선 사용자가 펼친 상태 유지.

### 5. 키보드 네비

- `sidebar-keyboard-nav.tsx` 훅이 사이드바 root에 keydown 등록
- focus가 사이드바 안에 있을 때만 화살표 ↑↓ 가로채서 인접 노드 link로 focus 이동
- focus가 본문에 있으면 핸들러 미발화 (페이지 스크롤 정상 동작)

## 비로그인 처리 정리

| 영역                | 동작                                   |
| ------------------- | -------------------------------------- |
| 사이드바 노드 목록  | 그대로 노출 (도메인 그룹 + 노드 link)  |
| 사이드바 인디케이터 | 미렌더 (○◐● 영역 자체 빠짐)            |
| 사이드바 푸터       | "로그인" 버튼 표시 (`<LoginPrompt />`) |
| 노드 페이지 본문    | 그대로 노출                            |
| `<MarkReading />`   | mount되지만 auth 미확인 시 트리거 skip |
| `<MarkCompleted />` | auth 미확인 시 unmount (DOM에 미존재)  |

인증 상태 판별: `@supabase/ssr`의 서버 클라이언트로 `getUser()` → 서버 컴포넌트에서 props로 내려보냄. 클라이언트 mutation 컴포넌트는 props로 받은 `userId` 유무로 분기.

## 리스크 / 대안

### 리스크

1. **RPC 추가로 마이그레이션 1개 더 필요** — 운영에선 Supabase 대시보드 SQL Editor 직접 실행 (1주차 컨벤션과 동일). 자동화 X.
2. **비로그인 사용자가 "다 읽었음" 버튼 못 봐서 진척도 시스템 자체를 모를 가능성** — 사이드바 푸터 "로그인" 버튼이 유일한 단서. 카피로 보강("로그인하면 진척도 추적").
3. **5초 임계값 너무 길어 실수로 페이지 이탈 시 reading 미기록** — MVP에선 단순함 우선. 사용자 피드백으로 조정.
4. **HydrationBoundary로 prefetch 시 RootLayout이 매 페이지에서 progress fetch → Supabase 쿼리 비용 증가** — RLS로 자기 것만, 노드 수 60~80 한도 → 무시 가능. React `cache()`로 동일 렌더 사이클 dedup.

### 거절된 대안

| 대안                                                   | 거절 이유                                 |
| ------------------------------------------------------ | ----------------------------------------- |
| 스크롤 끝 도달 자동 `completed`                        | 자가 점검 안 푼 채 스크롤만 한 케이스     |
| `localStorage` 또는 URL로 도메인 펼침 상태 저장        | CLAUDE.md localStorage 금지, URL은 노이즈 |
| 클라이언트에서 query 도착 후 reading 분기 (RPC 미사용) | race condition 코드 복잡                  |
| 비로그인 시 사이드바 자체 숨김                         | 학습 트리 탐색은 비로그인도 핵심          |
| 노드별 query (N개 fetch)                               | RLS 단일 fetch로 충분                     |

## 작업 단위 (writing-plans 입력 예고)

1. `0002_progress_rpc.sql` 추가 (Supabase 대시보드 실행 안내 포함)
2. `src/lib/supabase/progress.ts` — `getProgress`, `markReading(rpc)`, `markCompleted(upsert)` 함수
3. `src/lib/hooks/use-progress.ts` — React Query 훅 3종
4. `src/components/sidebar/node-tree.tsx` — 도메인 그룹 + 노드 link + 펼침 상태
5. `src/components/sidebar/progress-indicator.tsx` — ○◐● 아이콘
6. `src/components/sidebar/login-prompt.tsx` — 푸터 로그인 버튼
7. `src/components/sidebar/sidebar-keyboard-nav.tsx` — 화살표 핸들러 훅
8. `src/components/layout/app-sidebar.tsx` — 서버 컴포넌트로 SSR fetch + HydrationBoundary
9. `src/components/learn/mark-reading.tsx` — 5초 + visibility 트리거
10. `src/components/learn/mark-completed.tsx` — "다 읽었음" 버튼
11. `src/app/learn/[domain]/[slug]/page.tsx` — MarkReading·MarkCompleted mount
12. ROADMAP·CLAUDE.md 진척도 표시 갱신

## 완료 기준

- 로그인 사용자: 노드 페이지 5초 체류 → 사이드바 인디케이터 ○ → ◐ 즉시 반영 (낙관적)
- "다 읽었음" 클릭 → ◐ → ● 즉시 반영
- 비로그인: 사이드바 노드 목록 노출, 인디케이터·"다 읽았음" 버튼 미존재, 푸터 "로그인" 버튼
- 모바일: 햄버거로 사이드바 sheet 열기/닫기 정상
- 키보드: 사이드바 focus 시 ↑↓로 노드 간 focus 이동, 본문 focus 시 페이지 스크롤
- prod 배포 + 본인이 1회 end-to-end 시나리오 통과
