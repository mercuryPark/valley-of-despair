# 사이드바 트리 + 진척도 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ROADMAP 3주차 — 사이드바에 도메인 트리 + 진척도(○◐●) 동작을 박는다. 로그인 사용자는 5초 체류 시 자동 `reading`, "다 읽었음" 클릭으로 `completed`. 비로그인은 노드 트리만 노출.

**Architecture:** Supabase RPC로 reading 무회귀 보장(`INSERT ... ON CONFLICT DO NOTHING`), `@supabase/ssr` 서버 클라이언트로 진척도 prefetch + React Query `HydrationBoundary`로 인디케이터 깜빡임 제거. shadcn `Sidebar` 컴포넌트가 모바일 sheet·`SidebarProvider` 내장 처리.

**Tech Stack:** Next.js 16 App Router · TypeScript · `@supabase/ssr` · `@supabase/supabase-js` · `@tanstack/react-query` v5 · shadcn/ui · Tailwind

**참조:** `docs/superpowers/specs/2026-05-05-sidebar-progress-design.md`

**브랜치 전략:** `feat/sidebar-progress` 브랜치에서 작업, task별 commit, 마지막에 PR 생성 (feat/fix/refactor는 main 직접 push 금지).

---

## 사전 작업: 새 브랜치

- [ ] **새 브랜치 생성**

```bash
git checkout -b feat/sidebar-progress
```

---

## 파일 구조

### 신규 파일

| 파일                                                 | 책임                                  |
| ---------------------------------------------------- | ------------------------------------- |
| `supabase/migrations/0002_progress_rpc.sql`          | `mark_reading` RPC (회귀 차단)        |
| `src/lib/supabase/progress.ts`                       | server/client용 fetcher·mutation 함수 |
| `src/lib/hooks/use-progress.ts`                      | React Query 훅 3종                    |
| `src/components/sidebar/node-tree.tsx`               | 도메인 그룹 + 노드 link + 펼침 상태   |
| `src/components/sidebar/progress-indicator.tsx`      | ○◐● 아이콘 (useProgress 구독)         |
| `src/components/sidebar/login-prompt.tsx`            | 비로그인 푸터 로그인 버튼             |
| `src/components/sidebar/use-sidebar-keyboard-nav.ts` | 화살표 ↑↓ 핸들러 훅                   |
| `src/components/learn/mark-reading.tsx`              | 5초 + Page Visibility 트리거          |
| `src/components/learn/mark-completed.tsx`            | "다 읽었음" 버튼                      |
| `src/components/providers/query-provider.tsx`        | React Query Provider (없으면 신규)    |

### 수정 파일

| 파일                                     | 변경 종류                                               |
| ---------------------------------------- | ------------------------------------------------------- |
| `src/app/layout.tsx`                     | `QueryProvider` wrap 추가 (없는 경우)                   |
| `src/components/layout/app-sidebar.tsx`  | 서버 컴포넌트로 SSR fetch + HydrationBoundary + Tree    |
| `src/app/learn/[domain]/[slug]/page.tsx` | `<MarkReading />` mount + 본문 하단 `<MarkCompleted />` |
| `docs/ROADMAP.md`                        | 3주차 항목 체크 표시 (구현 후)                          |
| `CLAUDE.md`                              | "현재 진행 상황" 갱신 (구현 후)                         |

---

## Task 1: `mark_reading` RPC 마이그레이션

**Files:**

- Create: `supabase/migrations/0002_progress_rpc.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- Day 6: mark_reading RPC
-- 실행 방법: Supabase 대시보드 → SQL Editor에 이 파일 전체 붙여넣고 실행.
-- 목적: 클라이언트 race로 completed→reading 회귀 차단.

create or replace function public.mark_reading(p_slug text)
returns void
language sql
security invoker
as $$
  insert into public.progress (user_id, node_slug, status)
  values (auth.uid(), p_slug, 'reading')
  on conflict (user_id, node_slug) do nothing;
$$;
```

- [ ] **Step 2: Supabase 대시보드에서 실행 (수동)**

Supabase 대시보드 → SQL Editor → 파일 내용 붙여넣고 RUN.
검증: `select pg_get_functiondef('public.mark_reading'::regproc);` → 함수 정의 출력.

- [ ] **Step 3: commit**

```bash
git add supabase/migrations/0002_progress_rpc.sql
git commit -m "feat(progress): mark_reading RPC로 reading 회귀 차단"
```

---

## Task 2: progress fetcher·mutation 함수

**Files:**

- Create: `src/lib/supabase/progress.ts`

- [ ] **Step 1: 함수 작성**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export type ProgressStatus = 'reading' | 'completed';

export type ProgressRow = {
  node_slug: string;
  status: ProgressStatus;
  updated_at: string;
};

export async function getProgress(client: SupabaseClient): Promise<ProgressRow[]> {
  const { data, error } = await client.from('progress').select('node_slug, status, updated_at');
  if (error) throw error;
  return data ?? [];
}

export async function markReading(client: SupabaseClient, nodeSlug: string): Promise<void> {
  const { error } = await client.rpc('mark_reading', { p_slug: nodeSlug });
  if (error) throw error;
}

export async function markCompleted(
  client: SupabaseClient,
  nodeSlug: string,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from('progress')
    .upsert({ user_id: userId, node_slug: nodeSlug, status: 'completed' });
  if (error) throw error;
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

Expected: 통과.

- [ ] **Step 3: commit**

```bash
git add src/lib/supabase/progress.ts
git commit -m "feat(progress): fetcher·mutation 함수 (reading RPC + completed upsert)"
```

---

## Task 3: React Query 훅 3종

**Files:**

- Create: `src/lib/hooks/use-progress.ts`

**전제:** 클라이언트 supabase client 헬퍼는 `src/lib/supabase/client.ts`에 `createBrowserClient`로 만들어져 있다고 가정. 없으면 Step 1.5에서 생성.

- [ ] **Step 1: 훅 작성**

```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import { getProgress, markCompleted, markReading, type ProgressRow } from '@/lib/supabase/progress';

const QUERY_KEY = ['progress'] as const;

export function useProgress(enabled: boolean) {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getProgress(supabase),
    enabled,
    staleTime: 1000 * 60, // 1분
  });
}

export function useMarkReading() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => markReading(supabase, slug),
    onMutate: async (slug) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData<ProgressRow[]>(QUERY_KEY) ?? [];
      const exists = prev.some((p) => p.node_slug === slug);
      if (!exists) {
        qc.setQueryData<ProgressRow[]>(QUERY_KEY, [
          ...prev,
          { node_slug: slug, status: 'reading', updated_at: new Date().toISOString() },
        ]);
      }
      return { prev };
    },
    onError: (_err, _slug, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
    },
  });
}

export function useMarkCompleted(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => markCompleted(supabase, slug, userId),
    onMutate: async (slug) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData<ProgressRow[]>(QUERY_KEY) ?? [];
      const next = prev.some((p) => p.node_slug === slug)
        ? prev.map((p) =>
            p.node_slug === slug
              ? { ...p, status: 'completed' as const, updated_at: new Date().toISOString() }
              : p,
          )
        : [
            ...prev,
            {
              node_slug: slug,
              status: 'completed' as const,
              updated_at: new Date().toISOString(),
            },
          ];
      qc.setQueryData<ProgressRow[]>(QUERY_KEY, next);
      return { prev };
    },
    onError: (_err, _slug, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
    },
  });
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

Expected: 통과. (만약 `createClient` import 깨지면 `src/lib/supabase/client.ts` 존재 여부 확인.)

- [ ] **Step 3: commit**

```bash
git add src/lib/hooks/use-progress.ts
git commit -m "feat(progress): React Query 훅 3종 (낙관적 업데이트 포함)"
```

---

## Task 4: React Query Provider (없으면)

**Files:**

- Create: `src/components/providers/query-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 기존 QueryClientProvider 존재 확인**

```bash
grep -r "QueryClientProvider" src/
```

이미 있으면 Task 4 전체 skip하고 Task 5로.

- [ ] **Step 2: Provider 컴포넌트 작성**

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60, refetchOnWindowFocus: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: `layout.tsx`에서 wrap**

`PostHogProvider` 안쪽에 `<QueryProvider>` 추가:

```tsx
<PostHogProvider>
  <QueryProvider>
    <SidebarProvider defaultOpen>...</SidebarProvider>
  </QueryProvider>
</PostHogProvider>
```

- [ ] **Step 4: typecheck + 빌드**

```bash
pnpm typecheck && pnpm build
```

Expected: 통과 + 정적 라우트 동일.

- [ ] **Step 5: commit**

```bash
git add src/components/providers/query-provider.tsx src/app/layout.tsx
git commit -m "feat: React Query Provider 추가"
```

---

## Task 5: ProgressIndicator 컴포넌트

**Files:**

- Create: `src/components/sidebar/progress-indicator.tsx`

- [ ] **Step 1: 작성**

```tsx
'use client';

import { useProgress } from '@/lib/hooks/use-progress';

const LABEL = {
  unread: { glyph: '○', srText: '읽지 않음' },
  reading: { glyph: '◐', srText: '읽는 중' },
  completed: { glyph: '●', srText: '완료' },
} as const;

export function ProgressIndicator({ nodeSlug, enabled }: { nodeSlug: string; enabled: boolean }) {
  const { data } = useProgress(enabled);
  if (!enabled) return null;
  const row = data?.find((p) => p.node_slug === nodeSlug);
  const key: keyof typeof LABEL = row ? row.status : 'unread';
  const { glyph, srText } = LABEL[key];
  return (
    <span
      aria-label={srText}
      className="text-muted-foreground inline-block w-4 text-center text-xs"
    >
      {glyph}
    </span>
  );
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: commit**

```bash
git add src/components/sidebar/progress-indicator.tsx
git commit -m "feat(sidebar): ○◐● 진척도 인디케이터"
```

---

## Task 6: NodeTree 컴포넌트

**Files:**

- Create: `src/components/sidebar/node-tree.tsx`

`NodeMeta`는 `src/lib/content/loader.ts`에서 export됨.

- [ ] **Step 1: 작성**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProgressIndicator } from '@/components/sidebar/progress-indicator';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NodeMeta } from '@/lib/content/loader';
import { DOMAIN_META, DOMAINS, type Domain } from '@/lib/content/schema';

function currentDomainFromPath(pathname: string): Domain | null {
  const m = /^\/learn\/([^/]+)/.exec(pathname);
  if (!m) return null;
  const candidate = m[1]!;
  return (DOMAINS as readonly string[]).includes(candidate) ? (candidate as Domain) : null;
}

export function NodeTree({ nodes, showProgress }: { nodes: NodeMeta[]; showProgress: boolean }) {
  const pathname = usePathname();
  const currentDomain = currentDomainFromPath(pathname);
  const [expanded, setExpanded] = useState<Set<Domain>>(
    () => new Set(currentDomain ? [currentDomain] : []),
  );

  useEffect(() => {
    if (currentDomain) setExpanded(new Set([currentDomain]));
  }, [currentDomain]);

  function toggle(d: Domain) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  return (
    <>
      {DOMAINS.map((domain) => {
        const domainNodes = nodes.filter((n) => n.domain === domain);
        const isOpen = expanded.has(domain);
        return (
          <SidebarGroup key={domain}>
            <SidebarGroupLabel asChild>
              <button
                type="button"
                onClick={() => toggle(domain)}
                className="flex w-full items-center justify-between"
              >
                <span>{DOMAIN_META[domain].label}</span>
                <span className="text-xs">{isOpen ? '▾' : '▸'}</span>
              </button>
            </SidebarGroupLabel>
            {isOpen && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {domainNodes.map((n) => {
                    const href = `/learn/${n.domain}/${n.slug}`;
                    const isActive = pathname === href;
                    return (
                      <SidebarMenuItem key={n.frontmatter.id}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={href} className="flex items-center gap-2">
                            {showProgress && (
                              <ProgressIndicator
                                nodeSlug={n.frontmatter.id}
                                enabled={showProgress}
                              />
                            )}
                            <span className="truncate text-sm">{n.frontmatter.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {domainNodes.length === 0 && (
                    <p className="text-muted-foreground px-2 py-1 text-xs">준비 중</p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        );
      })}
    </>
  );
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: commit**

```bash
git add src/components/sidebar/node-tree.tsx
git commit -m "feat(sidebar): 도메인 그룹 + 노드 트리 + 펼침/접기"
```

---

## Task 7: LoginPrompt 컴포넌트

**Files:**

- Create: `src/components/sidebar/login-prompt.tsx`

- [ ] **Step 1: 작성**

`/login` 라우트는 1주차에 만들어졌다고 가정. 없으면 `href`만 placeholder로 두고 추후 갱신.

```tsx
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function LoginPrompt() {
  return (
    <div className="border-border space-y-2 border-t px-3 py-3 text-xs">
      <p className="text-muted-foreground">로그인하면 진척도 추적</p>
      <Button asChild size="sm" className="w-full">
        <Link href="/login">로그인</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: `/login` 경로 존재 확인**

```bash
ls src/app/login 2>/dev/null || echo "없음 — 경로 갱신 필요"
```

없으면 `href`를 `/auth/login` 같은 실제 경로로 수정.

- [ ] **Step 3: commit**

```bash
git add src/components/sidebar/login-prompt.tsx
git commit -m "feat(sidebar): 비로그인용 로그인 유도 푸터"
```

---

## Task 8: 키보드 네비 훅

**Files:**

- Create: `src/components/sidebar/use-sidebar-keyboard-nav.ts`

- [ ] **Step 1: 훅 작성**

```typescript
'use client';

import { useEffect, type RefObject } from 'react';

export function useSidebarKeyboardNav(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      if (!root || !root.contains(document.activeElement)) return;

      const links = Array.from(
        root.querySelectorAll<HTMLAnchorElement>('a[href^="/learn/"]'),
      ).filter((el) => el.offsetParent !== null);
      if (links.length === 0) return;

      const idx = links.findIndex((el) => el === document.activeElement);
      const nextIdx =
        e.key === 'ArrowDown' ? Math.min(idx + 1, links.length - 1) : Math.max(idx - 1, 0);
      if (idx === nextIdx) return;
      e.preventDefault();
      links[nextIdx]?.focus();
    }

    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [rootRef]);
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: commit**

```bash
git add src/components/sidebar/use-sidebar-keyboard-nav.ts
git commit -m "feat(sidebar): 화살표 ↑↓ 키보드 네비 훅"
```

---

## Task 9: AppSidebar 서버 컴포넌트로 재작성

**Files:**

- Modify: `src/components/layout/app-sidebar.tsx`

`@supabase/ssr`의 서버 클라이언트 헬퍼는 `src/lib/supabase/server.ts`에 있다고 가정. 없으면 별도 task로 만들기 전에 1주차 셋업 확인.

- [ ] **Step 1: 서버 클라이언트 위치 확인**

```bash
ls src/lib/supabase/
```

`server.ts`(서버), `client.ts`(브라우저) 모두 있어야 함. 없으면 stop하고 사용자에게 보고.

- [ ] **Step 2: AppSidebar 재작성**

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { LoginPrompt } from '@/components/sidebar/login-prompt';
import { NodeTree } from '@/components/sidebar/node-tree';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { listPublishedNodes } from '@/lib/content/loader';
import { createClient } from '@/lib/supabase/server';
import { getProgress } from '@/lib/supabase/progress';

export async function AppSidebar() {
  const supabase = await createClient();
  const [{ data: userData }, nodes] = await Promise.all([
    supabase.auth.getUser(),
    listPublishedNodes(),
  ]);
  const userId = userData.user?.id ?? null;

  const queryClient = new QueryClient();
  if (userId) {
    await queryClient.prefetchQuery({
      queryKey: ['progress'],
      queryFn: () => getProgress(supabase),
    });
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-2">
        <span className="font-serif text-base font-semibold">valleyofdespair</span>
      </SidebarHeader>
      <SidebarContent>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <NodeTree nodes={nodes} showProgress={Boolean(userId)} />
        </HydrationBoundary>
      </SidebarContent>
      <SidebarFooter>{!userId && <LoginPrompt />}</SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 3: typecheck + 빌드**

```bash
pnpm typecheck && pnpm build
```

Expected: 빌드 통과 + `/learn` 라우트 정상 정적 생성.

- [ ] **Step 4: 로컬 dev 서버 한 번 띄워 시각 확인**

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000/learn/foundations/html-parsing` 접속:

- 사이드바 좌측에 6개 도메인 그룹
- 현재 도메인(`foundations`)만 펼쳐져 있고 노드 항목 표시
- 다른 도메인 클릭 시 펼쳐짐
- 비로그인이면 푸터에 "로그인" 버튼 / 로그인했으면 노드 옆에 ○ 인디케이터

- [ ] **Step 5: commit**

```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "feat(sidebar): SSR fetch + HydrationBoundary + 노드 트리 wire"
```

---

## Task 10: MarkReading 컴포넌트

**Files:**

- Create: `src/components/learn/mark-reading.tsx`

- [ ] **Step 1: 작성**

```tsx
'use client';

import { useEffect, useRef } from 'react';

import { useMarkReading } from '@/lib/hooks/use-progress';

const THRESHOLD_MS = 5000;

export function MarkReading({ nodeSlug, enabled }: { nodeSlug: string; enabled: boolean }) {
  const { mutate } = useMarkReading();
  const accumulatedMs = useRef(0);
  const visibleSinceMs = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || firedRef.current) return;

    function onVisible() {
      if (document.visibilityState === 'visible') {
        visibleSinceMs.current = Date.now();
      } else {
        if (visibleSinceMs.current !== null) {
          accumulatedMs.current += Date.now() - visibleSinceMs.current;
          visibleSinceMs.current = null;
        }
      }
      checkAndFire();
    }

    function checkAndFire() {
      const live = visibleSinceMs.current !== null ? Date.now() - visibleSinceMs.current : 0;
      if (accumulatedMs.current + live >= THRESHOLD_MS && !firedRef.current) {
        firedRef.current = true;
        mutate(nodeSlug);
      }
    }

    if (document.visibilityState === 'visible') {
      visibleSinceMs.current = Date.now();
    }
    const interval = window.setInterval(checkAndFire, 500);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, nodeSlug, mutate]);

  return null;
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: commit**

```bash
git add src/components/learn/mark-reading.tsx
git commit -m "feat(progress): 5초 + Page Visibility로 reading 자동 트리거"
```

---

## Task 11: MarkCompleted 버튼

**Files:**

- Create: `src/components/learn/mark-completed.tsx`

- [ ] **Step 1: 작성**

```tsx
'use client';

import { useProgress, useMarkCompleted } from '@/lib/hooks/use-progress';
import { Button } from '@/components/ui/button';

export function MarkCompleted({ nodeSlug, userId }: { nodeSlug: string; userId: string }) {
  const { data } = useProgress(true);
  const { mutate, isPending } = useMarkCompleted(userId);
  const isCompleted = data?.some((p) => p.node_slug === nodeSlug && p.status === 'completed');

  return (
    <Button
      type="button"
      onClick={() => mutate(nodeSlug)}
      disabled={isCompleted || isPending}
      variant={isCompleted ? 'secondary' : 'default'}
      className="mt-8 w-full"
    >
      {isCompleted ? '● 완료한 노드' : '다 읽었음'}
    </Button>
  );
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: commit**

```bash
git add src/components/learn/mark-completed.tsx
git commit -m "feat(progress): 다 읽었음 버튼 + completed 상태 토글 표시"
```

---

## Task 12: 노드 페이지에 Mark 컴포넌트 wire

**Files:**

- Modify: `src/app/learn/[domain]/[slug]/page.tsx`

- [ ] **Step 1: 페이지 상단에서 user 인증 가져오기**

기존 `NodePage` 함수 시작 부분에 supabase 서버 클라이언트로 `getUser()` 호출 추가:

```typescript
import { createClient } from '@/lib/supabase/server';
import { MarkCompleted } from '@/components/learn/mark-completed';
import { MarkReading } from '@/components/learn/mark-reading';
```

함수 본문 (`const { domain, slug } = await params;` 다음 줄에 추가):

```typescript
const supabase = await createClient();
const { data: userData } = await supabase.auth.getUser();
const userId = userData.user?.id ?? null;
```

- [ ] **Step 2: JSX에 Mark 컴포넌트 박기**

`<article>` 안 가장 위에 `<MarkReading nodeSlug={node.frontmatter.id} enabled={Boolean(userId)} />`,
큐레이션 푸터(`이 노드는 외부 자료...`) 직전에 `userId &&` 가드로 `<MarkCompleted nodeSlug={node.frontmatter.id} userId={userId} />`.

```tsx
return (
  <article>
    <MarkReading nodeSlug={node.frontmatter.id} enabled={Boolean(userId)} />

    <div className="text-muted-foreground mb-6 text-sm">... (기존 내용)</div>

    {/* ... 기존 header / mdx-body ... */}

    {userId && <MarkCompleted nodeSlug={node.frontmatter.id} userId={userId} />}

    <p className="text-muted-foreground border-border mt-8 border-t pt-4 text-xs">
      이 노드는 외부 자료(MDN·web.dev·공식 문서)와 LLM 보조로 정리한 학습 노트이다.
    </p>

    {/* ... 기존 nav (prev/next) ... */}
  </article>
);
```

- [ ] **Step 3: typecheck + 빌드**

```bash
pnpm typecheck && pnpm build
```

Expected: 통과.

- [ ] **Step 4: 로컬 dev 시각 확인**

```bash
pnpm dev
```

체크리스트:

- 비로그인 상태로 노드 페이지 접속 → "다 읽었음" 버튼 미표시
- 로그인 상태로 노드 페이지 접속 → "다 읽었음" 버튼 노출
- 5초 머무르고 사이드바 인디케이터 ◐ 변경 (낙관적 즉시 반영)
- "다 읽었음" 클릭 → 버튼 라벨 "● 완료한 노드" + 사이드바 ●

- [ ] **Step 5: commit**

```bash
git add src/app/learn/'[domain]'/'[slug]'/page.tsx
git commit -m "feat(learn): 노드 페이지에 MarkReading·MarkCompleted wire"
```

---

## Task 13: 문서 갱신

**Files:**

- Modify: `docs/ROADMAP.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: ROADMAP 3주차 항목 체크**

`docs/ROADMAP.md`의 "## 3주차: 사이드바 트리 + 진척도" 섹션 6개 `[ ]`를 모두 `[x]`로 갱신, 완료일 추가:

```markdown
## 3주차: 사이드바 트리 + 진척도 (완료 — 2026-05-05)

- [x] 사이드바 컴포넌트 (도메인 그룹 + 노드 목록 + 진척도 표시)
- [x] 모바일 햄버거 메뉴 (Sheet)
- [x] 키보드 네비 (Tab, 화살표)
- [x] 진척도 토글 (`unread / reading / completed`)
- [x] React Query로 진척도 동기화 (낙관적 업데이트)
- [x] 인증 안 된 상태 처리 (진척도는 로컬 미사용, 로그인 유도)
```

- [ ] **Step 2: CLAUDE.md "현재 진행 상황" 갱신**

기존:

```markdown
## 현재 진행 상황

- **단계**: 2주차 항목 E 직전 — 제품 피벗 완료, 더미 노드 6개 작성 진입
- **방금 완료**: 제품 피벗(...)
```

→

```markdown
## 현재 진행 상황

- **단계**: 4주차 진입 직전 — 사이드바 + 진척도 완료
- **방금 완료**: 3주차 사이드바 트리 + 진척도(`docs/superpowers/specs/2026-05-05-sidebar-progress-design.md`)
```

- [ ] **Step 3: commit**

```bash
git add docs/ROADMAP.md CLAUDE.md
git commit -m "docs: 3주차 완료 → 4주차 시작 표기"
```

---

## Task 14: PR 생성

- [ ] **Step 1: push + PR**

```bash
git push -u origin feat/sidebar-progress
gh pr create --title "feat: 3주차 사이드바 트리 + 진척도" --body "$(cat <<'EOF'
## Summary
- 사이드바에 도메인 그룹 + 노드 트리 + 진척도(○◐●) 인디케이터
- 5초 + Page Visibility 자동 reading + 명시 클릭 completed
- React Query 낙관적 업데이트 + HydrationBoundary로 SSR prefetch
- 비로그인 시 노드 트리만, 진척도 영역·"다 읽었음" 버튼 비노출

## Spec
- docs/superpowers/specs/2026-05-05-sidebar-progress-design.md
- docs/superpowers/plans/2026-05-05-sidebar-progress.md

## DB 마이그레이션
- supabase/migrations/0002_progress_rpc.sql — Supabase 대시보드 SQL Editor에서 실행 필요

## Test plan
- [ ] 비로그인: 사이드바 노드 트리 + 푸터 로그인 버튼 노출, "다 읽었음" 버튼 미존재
- [ ] 로그인: 노드 페이지 5초 체류 → 사이드바 ◐ 즉시 반영
- [ ] 로그인: "다 읽었음" 클릭 → ● 즉시 반영, 버튼 라벨 "완료한 노드"로 토글
- [ ] 모바일: 햄버거로 사이드바 sheet 열기/닫기 정상
- [ ] 키보드: 사이드바 focus 시 ↑↓ 노드 간 이동
- [ ] 본문 focus 시 ↑↓ 페이지 스크롤 (충돌 없음)
- [ ] prod 배포 후 동일 시나리오 재확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: PR URL 사용자에게 공유**

merge는 사용자가 직접 GitHub에서.

---

## 실행 후 사용자 행동 (자동 X)

1. **Supabase 대시보드에서 `0002_progress_rpc.sql` 실행** — 자동화 X (1주차 컨벤션)
2. **PR 리뷰 + merge** — main 직접 push 금지
3. **Vercel 배포 확인** — merge 후 자동 빌드, 5분 대기
4. **prod에서 end-to-end 시나리오 통과 확인**

---

## 자가 점검 체크리스트 (이 plan 작성자용)

- ✅ Spec의 Q1~Q10 결정 모두 task에 매핑됨
- ✅ 12개 작업 단위 → 14개 task로 분해 (브랜치 생성 + PR 추가)
- ✅ Placeholder 없음, 모든 코드 박힘
- ✅ 타입 일관성 (`ProgressRow`, `ProgressStatus`, `node_slug` 컬럼명)
- ✅ TDD 미강요 (CLAUDE.md 컨벤션 준수)
- ✅ feat 브랜치 + PR 워크플로 (사용자 feedback 메모리 준수)
