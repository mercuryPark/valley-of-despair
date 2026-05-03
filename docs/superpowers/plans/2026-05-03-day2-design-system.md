# Day 2 디자인 시스템 + 글로벌 레이아웃 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 빈 Next.js 16 scaffold 위에 Valley 디자인 시스템(stone + Crimson Pro + amber)과 다크/라이트 토글, shadcn/ui 5컴포넌트, 글로벌 레이아웃(헤더+사이드바슬롯+메인+풋터)을 얹어 prod URL이 Valley 톤으로 보이는 상태를 만든다.

**Architecture:** 작업을 3개 PR로 분리. (1) shadcn/ui 인프라(공식 init + 5 컴포넌트) → (2) Valley 디자인 토큰 + next-themes 통합 → (3) 글로벌 레이아웃 컴포넌트. 각 PR이 독립적으로 빌드·preview 검증 가능.

**Tech Stack:** Next.js 16, Tailwind v4 (`@theme inline`), shadcn/ui (new-york style, stone base), next-themes, Crimson Pro (next/font/google), lucide-react, OKLCH 색공간.

**Reference spec:** `docs/superpowers/specs/2026-05-03-day2-design-system-design.md`

**Reference brainstorm decisions:**

1. 시각 방향성 = Atmosphere "Valley"
2. Dark default + Light optional
3. Heading serif = Crimson Pro
4. Accent = amber-600 (1색)
5. Layout = Sidebar(L) + Main + Footer

---

## File Structure (after all PRs)

```
src/
├─ app/
│  ├─ globals.css              # MODIFIED: Valley tokens (PR #6)
│  ├─ layout.tsx               # MODIFIED: ThemeProvider + SidebarProvider + Header/Inset/Footer (PR #6, #7)
│  └─ page.tsx                 # MODIFIED: scaffold ad → valleyofdespair welcome (PR #7)
├─ components/
│  ├─ ui/                      # CREATED by shadcn (PR #5)
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  ├─ sheet.tsx
│  │  ├─ skeleton.tsx
│  │  └─ sidebar.tsx
│  ├─ layout/
│  │  ├─ app-sidebar.tsx       # CREATED: empty Sidebar shell (PR #7)
│  │  ├─ site-header.tsx       # CREATED: brand + sidebar trigger + theme toggle (PR #7)
│  │  └─ site-footer.tsx       # CREATED: copyright + GitHub link (PR #7)
│  ├─ theme-provider.tsx       # CREATED: next-themes wrapper (PR #6)
│  └─ theme-toggle.tsx         # CREATED: Sun/Moon button (PR #6)
└─ lib/
   └─ utils.ts                 # CREATED by shadcn: cn() helper (PR #5)

components.json                 # CREATED by shadcn (PR #5)
```

Each task is self-contained and stays on the active branch. Subagents must NOT push or merge — controller (you) handles those at task batch boundaries.

---

## PR #5 — chore: shadcn/ui setup

Branch: `chore/shadcn-setup`. Goal: shadcn 초기화 + 5컴포넌트 설치. globals.css가 shadcn 기본 stone 토큰으로 덮어쓰임 — 그건 PR #6에서 Valley 토큰으로 다시 덮어씀.

### Task 1: Branch + shadcn init

**Files:**

- Create: `components.json` (by shadcn)
- Create: `src/lib/utils.ts` (by shadcn)
- Modify: `src/app/globals.css` (by shadcn)
- Modify: `package.json` (by shadcn — adds `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`)
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/hoyeon/Documents/workspace/valleyofdespair
git checkout main && git pull --ff-only
git checkout -b chore/shadcn-setup
```

- [ ] **Step 2: 현재 globals.css 백업 보존 확인**

Run: `git show main:src/app/globals.css | head -10`
Expected: scaffold 기본 globals.css 출력 (`@import 'tailwindcss';` 등). 이건 PR #5 작업 범위에선 잠시 shadcn 기본으로 덮어써짐. PR #6에서 Valley 토큰으로 재작성.

- [ ] **Step 3: shadcn init 실행 (non-interactive)**

```bash
pnpm dlx shadcn@latest init --yes --base-color stone
```

`--yes`로 prompt 스킵하면 다음 default 채택:

- TypeScript: yes (자동 감지)
- Style: `new-york` (deprecated된 `default`보다 최신)
- Base color: `stone` (CLI 인자로 명시)
- CSS variables: yes
- React Server Components: yes
- 별칭: `@/components`, `@/lib/utils`
- Icon library: `lucide`

Expected: `components.json`, `src/lib/utils.ts` 생성됨. `src/app/globals.css` 수정됨 (shadcn stone 기본 토큰 추가).

- [ ] **Step 4: components.json 검증**

Run: `cat components.json`
Expected:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

`style`이 `new-york`이 아니거나 `baseColor`가 `stone`이 아니면 즉시 수정:

```bash
# 예시 — jq로 정확히 패치
jq '.style = "new-york" | .tailwind.baseColor = "stone"' components.json > components.json.tmp && mv components.json.tmp components.json
```

- [ ] **Step 5: lib/utils.ts 검증**

Run: `cat src/lib/utils.ts`
Expected:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: 빌드 통과 확인**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 모두 통과. format:check가 실패하면 `pnpm format` 후 재실행.

- [ ] **Step 7: 명시적 스테이징 + 커밋**

Run: `git status --porcelain`
Expected 파일 목록: `components.json`, `src/lib/utils.ts`, `src/app/globals.css`, `package.json`, `pnpm-lock.yaml`.

```bash
git add components.json src/lib/utils.ts src/app/globals.css package.json pnpm-lock.yaml
git commit -m "chore(shadcn): init shadcn/ui (new-york, stone base, RSC, lucide)"
```

(Husky pre-commit이 prettier 자동 적용. 통과 OK.)

---

### Task 2: Add 5 shadcn components

**Files:**

- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/sidebar.tsx`
- Modify: `package.json` (Radix primitives 추가)
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 5 컴포넌트 추가**

```bash
pnpm dlx shadcn@latest add button card sheet skeleton sidebar --yes
```

Expected:

- `src/components/ui/{button,card,sheet,skeleton,sidebar}.tsx` 생성
- 자동 의존 설치: `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `@radix-ui/react-separator`, `@radix-ui/react-tooltip` (Sidebar가 Tooltip 의존)
- sidebar는 hook도 추가 (`src/hooks/use-mobile.ts` 등). 구체 파일은 shadcn CLI 결과로 파악.

- [ ] **Step 2: 생성 파일 확인**

Run:

```bash
ls src/components/ui/
ls src/hooks/ 2>/dev/null || echo "(no hooks dir)"
```

Expected: `button.tsx`, `card.tsx`, `sheet.tsx`, `skeleton.tsx`, `sidebar.tsx`. hooks/ 디렉토리는 sidebar가 만들 수 있음 (`use-mobile.ts`).

- [ ] **Step 3: 빌드 통과 확인**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 모두 통과. format:check 실패 시 `pnpm format` 후 재실행.

- [ ] **Step 4: 임포트 smoke test**

`src/app/page.tsx`를 일시 수정해 컴포넌트 임포트 테스트:

```tsx
// 일시 추가 — Step 5에서 되돌림
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Sidebar } from '@/components/ui/sidebar';
```

Run: `pnpm typecheck`
Expected: 타입 에러 없음. 5 임포트 모두 resolve.

검증 후 `git restore src/app/page.tsx`로 원복.

- [ ] **Step 5: 명시적 스테이징 + 커밋**

Run: `git status --porcelain` — 변경 파일 확인.

```bash
git add src/components/ui package.json pnpm-lock.yaml
# hooks 디렉토리가 생성됐다면:
[ -d src/hooks ] && git add src/hooks
git commit -m "chore(shadcn): add Button/Card/Sheet/Skeleton/Sidebar components"
```

---

### Task 3: PR #5 push + 머지

**Files:** (none — Git/GitHub operations only)

- [ ] **Step 1: push**

```bash
git push -u origin chore/shadcn-setup
```

- [ ] **Step 2: PR 생성**

```bash
gh pr create --title "chore: shadcn/ui init + 5 components" \
  --body "$(cat <<'EOF'
## Summary
Day 2 PR #1 of 3.
- shadcn/ui init (new-york style, stone base, RSC, lucide)
- 5 components: Button, Card, Sheet, Skeleton, Sidebar (ROADMAP)

## Notes
- globals.css가 shadcn 기본 stone 토큰으로 덮어쓰임 — Day 2 PR #2에서 Valley 토큰으로 재작성 예정
- 다음 PR이 머지될 때까지 시각적 변화는 거의 없음 (scaffold UI 그대로)

## Test plan
- [ ] Vercel preview 빌드 성공
- [ ] preview URL에서 페이지 정상 (시각 변화 없음)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Vercel preview 통과 확인 후 머지**

```bash
# preview 통과까지 대기 — gh pr checks 또는 controller가 Monitor로 추적
gh pr merge --squash --delete-branch
git checkout main && git pull --ff-only
```

---

## PR #6 — feat: Valley design tokens + theme system

Branch: `feat/valley-tokens`. Goal: globals.css를 Valley 토큰으로 재작성, Crimson Pro 폰트 추가, next-themes 통합, ThemeToggle 컴포넌트.

### Task 4: Branch + Valley globals.css 재작성

**Files:**

- Modify: `src/app/globals.css` — shadcn 기본 stone 토큰을 Valley OKLCH 토큰으로 교체

- [ ] **Step 1: 브랜치 생성**

```bash
git checkout main && git pull --ff-only
git checkout -b feat/valley-tokens
```

- [ ] **Step 2: globals.css 전체 교체**

Replace `src/app/globals.css` 전체 내용을:

```css
@import 'tailwindcss';

@theme inline {
  /* fonts */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-serif: var(--font-crimson-pro);

  /* surfaces */
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-fg);
  --color-border: var(--border);
  --color-card: var(--card);
  --color-card-foreground: var(--card-fg);

  /* shadcn 호환 매핑 */
  --color-popover: var(--card);
  --color-popover-foreground: var(--card-fg);
  --color-secondary: var(--muted);
  --color-secondary-foreground: var(--fg);
  --color-accent: var(--muted);
  --color-accent-foreground: var(--fg);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--fg);
  --color-input: var(--border);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-fg);
  --color-ring: var(--ring);

  /* sidebar */
  --color-sidebar: var(--sidebar-bg);
  --color-sidebar-foreground: var(--fg);
  --color-sidebar-primary: var(--primary);
  --color-sidebar-primary-foreground: var(--primary-fg);
  --color-sidebar-accent: var(--muted);
  --color-sidebar-accent-foreground: var(--fg);
  --color-sidebar-border: var(--border);
  --color-sidebar-ring: var(--ring);

  /* radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}

/* shadcn 표준: :root = light, .dark = dark override.
   defaultTheme="dark"로 첫 로드 시 <html class="dark">가 적용 → Valley 보임. */

:root {
  /* light tokens */
  --bg: oklch(0.985 0.002 60);
  --fg: oklch(0.22 0.005 60);
  --muted: oklch(0.96 0.003 60);
  --muted-fg: oklch(0.45 0.005 60);
  --border: oklch(0.91 0.004 60);
  --card: oklch(1 0 0);
  --card-fg: var(--fg);
  --sidebar-bg: oklch(0.98 0.002 60);
  --primary: oklch(0.55 0.18 50);
  --primary-fg: oklch(0.985 0.002 60);
  --ring: oklch(0.55 0.18 50);
  --destructive: oklch(0.5 0.2 25);
}

.dark {
  /* dark tokens — Valley */
  --bg: oklch(0.14 0.005 60);
  --fg: oklch(0.985 0.002 60);
  --muted: oklch(0.22 0.005 60);
  --muted-fg: oklch(0.66 0.005 60);
  --border: oklch(0.27 0.005 60);
  --card: oklch(0.22 0.005 60);
  --card-fg: var(--fg);
  --sidebar-bg: oklch(0.18 0.005 60);
  --primary: oklch(0.66 0.165 55);
  --primary-fg: oklch(0.14 0.005 60);
  --ring: oklch(0.66 0.165 55);
  --destructive: oklch(0.55 0.18 25);
}

body {
  font-family: var(--font-sans);
}
```

- [ ] **Step 3: 빌드 통과 확인**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과. `pnpm build` 출력에 CSS 컴파일 경고 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/app/globals.css
git commit -m "feat(tokens): Valley OKLCH stone palette + amber primary + shadcn 매핑"
```

---

### Task 5: Crimson Pro 폰트 + layout.tsx 폰트 변수

**Files:**

- Modify: `src/app/layout.tsx` — Crimson Pro 추가, html className에 `--font-crimson-pro` 변수 포함

- [ ] **Step 1: layout.tsx 수정 (폰트 임포트만 — ThemeProvider/SidebarProvider는 다음 task에서)**

Replace `src/app/layout.tsx` 전체:

```tsx
import type { Metadata } from 'next';
import { Crimson_Pro, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const crimsonPro = Crimson_Pro({
  variable: '--font-crimson-pro',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'valleyofdespair',
  description: 'FE 학습 플랫폼 — 렌더링·상태·성능·비동기',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${crimsonPro.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: 빌드 통과 확인**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과. 빌드 로그에 Crimson Pro 다운로드/self-host 메시지 가능 (Next.js 정상 동작).

- [ ] **Step 3: 커밋**

```bash
git add src/app/layout.tsx
git commit -m "feat(fonts): Crimson Pro 헤딩 serif 추가, lang=ko, metadata 갱신"
```

---

### Task 6: next-themes 설치 + ThemeProvider 컴포넌트

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx` — ThemeProvider로 children 감쌈

- [ ] **Step 1: next-themes 설치**

```bash
pnpm add next-themes
```

- [ ] **Step 2: ThemeProvider 컴포넌트 작성**

Create `src/components/theme-provider.tsx`:

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

- [ ] **Step 3: layout.tsx에 ThemeProvider 통합**

Replace `<body className="..." >...</body>` 전체를:

```tsx
<body className="bg-background text-foreground flex min-h-full flex-col font-sans">
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    {children}
  </ThemeProvider>
</body>
```

상단에 import 추가:

```tsx
import { ThemeProvider } from '@/components/theme-provider';
```

또한 `<html>`에 `suppressHydrationWarning` prop 추가:

```tsx
<html
  lang="ko"
  suppressHydrationWarning
  className={`${geistSans.variable} ${geistMono.variable} ${crimsonPro.variable} h-full antialiased`}
>
```

- [ ] **Step 4: 빌드 통과 확인**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과.

- [ ] **Step 5: 커밋**

```bash
git add package.json pnpm-lock.yaml src/components/theme-provider.tsx src/app/layout.tsx
git commit -m "feat(theme): next-themes 통합 (dark default + class attribute)"
```

---

### Task 7: ThemeToggle 컴포넌트

**Files:**

- Create: `src/components/theme-toggle.tsx`

- [ ] **Step 1: ThemeToggle 작성**

Create `src/components/theme-toggle.tsx`:

```tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <Moon className="absolute h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
    </Button>
  );
}
```

- [ ] **Step 2: 빌드 통과 확인**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과. (이 컴포넌트는 아직 layout에 연결 안 됨 — Task 10에서 SiteHeader가 사용.)

- [ ] **Step 3: 커밋**

```bash
git add src/components/theme-toggle.tsx
git commit -m "feat(theme): Sun/Moon 토글 버튼 (ghost icon variant)"
```

---

### Task 8: PR #6 push + 머지

**Files:** (none — Git/GitHub operations)

- [ ] **Step 1: push**

```bash
git push -u origin feat/valley-tokens
```

- [ ] **Step 2: PR 생성**

```bash
gh pr create --title "feat: Valley design tokens + Crimson Pro + next-themes" \
  --body "$(cat <<'EOF'
## Summary
Day 2 PR #2 of 3.
- globals.css: Valley OKLCH stone palette + amber-600 primary + shadcn 토큰 매핑
- Crimson Pro 헤딩 serif (next/font/google self-host), lang=ko, metadata 갱신
- next-themes 통합 (attribute=class, defaultTheme=dark, enableSystem=false)
- ThemeToggle 컴포넌트 (Sun/Moon, ghost icon)

## Notes
- 시각 변화: 페이지 배경이 어두운 stone으로 전환됨 (Valley dark default)
- 토글 UI는 Layout 컴포넌트(다음 PR)에 연결되기 전까지 화면에 노출 안 됨

## Test plan
- [ ] Vercel preview 빌드 성공
- [ ] preview URL: 다크 배경 (#0c0a09 ~), white-ish 텍스트
- [ ] 로컬 dev에서 `<html>` 클래스에 `dark` 포함 확인 (개발자 도구)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Vercel preview 통과 확인 후 머지**

```bash
gh pr merge --squash --delete-branch
git checkout main && git pull --ff-only
```

---

## PR #7 — feat: global layout shell

Branch: `feat/global-layout`. Goal: AppSidebar(empty), SiteHeader, SiteFooter 작성 + layout.tsx에 SidebarProvider 통합 + page.tsx 인사 페이지로 교체.

### Task 9: AppSidebar (빈 껍데기)

**Files:**

- Create: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1: 브랜치 생성**

```bash
git checkout main && git pull --ff-only
git checkout -b feat/global-layout
```

- [ ] **Step 2: AppSidebar 작성**

Create `src/components/layout/app-sidebar.tsx`:

```tsx
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-2" />
      <SidebarContent>{/* Week 3에 도메인 그룹 + 노드 tree 채움 */}</SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
```

- [ ] **Step 3: 빌드 통과**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과.

- [ ] **Step 4: 커밋**

```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "feat(layout): AppSidebar 빈 껍데기 (Week 3에 노드 tree 채움)"
```

---

### Task 10: SiteHeader

**Files:**

- Create: `src/components/layout/site-header.tsx`

- [ ] **Step 1: SiteHeader 작성**

Create `src/components/layout/site-header.tsx`:

```tsx
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader() {
  return (
    <header className="border-border bg-background sticky top-0 z-30 flex h-12 items-center gap-3 border-b px-4">
      <SidebarTrigger className="md:hidden" />
      <Link href="/" className="font-serif text-base font-medium tracking-tight">
        valleyofdespair
      </Link>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 빌드 통과**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/site-header.tsx
git commit -m "feat(layout): SiteHeader (brand serif + sidebar trigger + theme toggle)"
```

---

### Task 11: SiteFooter

**Files:**

- Create: `src/components/layout/site-footer.tsx`

- [ ] **Step 1: SiteFooter 작성**

Create `src/components/layout/site-footer.tsx`:

```tsx
export function SiteFooter() {
  return (
    <footer className="border-border text-muted-foreground border-t px-6 py-6 text-xs">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <span>© 2026 valleyofdespair</span>
        <a
          href="https://github.com/mercuryPark/valley-of-despair"
          className="hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: 빌드 통과**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/site-footer.tsx
git commit -m "feat(layout): SiteFooter (copyright + GitHub link)"
```

---

### Task 12: layout.tsx에 SidebarProvider + Header/Inset/Footer 통합

**Files:**

- Modify: `src/app/layout.tsx` — SidebarProvider 트리 추가

- [ ] **Step 1: layout.tsx 갱신**

Replace `src/app/layout.tsx` 전체:

```tsx
import type { Metadata } from 'next';
import { Crimson_Pro, Geist, Geist_Mono } from 'next/font/google';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const crimsonPro = Crimson_Pro({
  variable: '--font-crimson-pro',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'valleyofdespair',
  description: 'FE 학습 플랫폼 — 렌더링·상태·성능·비동기',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${crimsonPro.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <SidebarInset className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">{children}</main>
              <SiteFooter />
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: 빌드 통과**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과. 빌드 출력에 두 라우트(`/`, `/_not-found`) 모두 정적(○).

- [ ] **Step 3: 로컬 dev 검증**

Run (백그라운드): `pnpm dev`
Expected:

- HTTP 200 from http://localhost:3000
- 헤더 sticky h-12 (brand "valleyofdespair" Crimson Pro)
- 좌측 사이드바 빈 칸 (border만 보임)
- 메인 가운데, max-w-3xl
- 풋터 한 줄 (© 2026 + GitHub)
- 다크 배경 (#0c0a09 ~)
- theme toggle 클릭 시 light 전환

```bash
# verify
curl -s http://localhost:3000 | grep -oE "valleyofdespair" | head -1
# Expected: "valleyofdespair"
```

종료: dev 서버 백그라운드 프로세스 kill.

- [ ] **Step 4: 커밋**

```bash
git add src/app/layout.tsx
git commit -m "feat(layout): RootLayout SidebarProvider + Header/Inset/Footer 통합"
```

---

### Task 13: page.tsx 인사 페이지로 교체

**Files:**

- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx 전체 교체**

Replace `src/app/page.tsx` 전체:

```tsx
export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl font-medium tracking-tight">valleyofdespair</h1>
      <p className="text-muted-foreground text-lg">
        FE 학습 플랫폼 — 렌더링·상태·성능·비동기를 깊이 학습합니다.
      </p>
      <p className="text-muted-foreground text-sm">
        Day 2 셋업 중. 콘텐츠는 Week 5부터 채워집니다.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 + dev 검증**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: 통과. 빌드 출력에 `/` 정적 페이지.

Run: `pnpm dev` (백그라운드)
브라우저(또는 curl)로 http://localhost:3000:

- "valleyofdespair" h1이 Crimson Pro로 렌더
- 두 줄 본문이 muted-foreground 색
- 헤더·사이드바·풋터 모두 정상

```bash
curl -s http://localhost:3000 | grep -oE "valleyofdespair|FE 학습 플랫폼|Day 2 셋업" | head -3
# Expected 3 줄: "valleyofdespair", "FE 학습 플랫폼", "Day 2 셋업"
```

종료: dev 서버 kill.

- [ ] **Step 3: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat(page): scaffold 광고 → valleyofdespair 인사 페이지"
```

---

### Task 14: PR #7 push + 머지 + Day 2 마감

**Files:** (none — Git/GitHub operations)

- [ ] **Step 1: push**

```bash
git push -u origin feat/global-layout
```

- [ ] **Step 2: PR 생성**

```bash
gh pr create --title "feat: 글로벌 레이아웃 (Sidebar slot + Header + Main + Footer)" \
  --body "$(cat <<'EOF'
## Summary
Day 2 PR #3 of 3.
- AppSidebar (빈 껍데기, Week 3에 채움)
- SiteHeader (brand serif + sidebar trigger + theme toggle)
- SiteFooter (copyright + GitHub)
- layout.tsx에 SidebarProvider + SidebarInset 통합
- page.tsx scaffold 광고 → valleyofdespair 인사

## Day 2 완료 검증
- [ ] Vercel prod URL: 다크 Valley 배경, "valleyofdespair" h1 Crimson Pro
- [ ] 헤더 sticky, theme toggle 작동 (dark ↔ light)
- [ ] 좌측 사이드바 슬롯 (빈 칸) — Week 3에 노드 tree
- [ ] 모바일 (<768px): 사이드바 hidden, 햄버거 trigger 노출 → 클릭 시 Sheet

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Vercel preview 통과 + 머지**

```bash
gh pr merge --squash --delete-branch
git checkout main && git pull --ff-only
```

- [ ] **Step 4: Vercel prod 배포 검증**

main 머지 → Vercel auto prod 배포. Monitor로 Ready 대기 또는:

```bash
sleep 60
curl -s -o /tmp/prod.html -w "HTTP %{http_code}\n" https://valleyofdespair.vercel.app
grep -oE "valleyofdespair|FE 학습 플랫폼" /tmp/prod.html | head -2
```

Expected: HTTP 200, 두 텍스트 모두 매칭.

---

## Day 2 완료 체크 (controller가 PR #7 머지 후)

- [ ] ROADMAP Day 2 4개 항목 모두 만족:
  - [x] Tailwind v4 디자인 토큰 정의 (PR #6)
  - [x] 다크/라이트 모드 (next-themes) (PR #6)
  - [x] shadcn/ui 초기 컴포넌트 5개 (PR #5)
  - [x] 글로벌 레이아웃 (헤더 + 메인 + 풋터) (PR #7)
- [ ] Vercel prod URL `https://valleyofdespair.vercel.app` 시각 확인:
  - 다크 Valley 톤
  - Crimson Pro 헤딩
  - 헤더·사이드바 슬롯·메인·풋터 grid
  - theme toggle dark ↔ light 정상
- [ ] ROADMAP.md "Day 2 (현재 단계)" → "Day 2 (완료)", Day 3을 "현재 단계"로 갱신 (별도 docs PR)
- [ ] CLAUDE.md "현재 진행 상황"을 Day 3로 갱신 (위 docs PR에 묶음)
- [ ] (선택) `.gitignore`에 `.superpowers/` 추가하는 cleanup PR — visual companion 임시 파일들이 untracked로 잡히는 것 정리

## Out of scope (다른 Day로 미룸)

- Supabase auth + RLS (Day 3)
- MDX 콘텐츠 파이프라인 + frontmatter Zod (Day 4)
- 사이드바 노드 tree 실내용 (Week 3)
- 우측 TOC, 검색, 코드 하이라이팅 (Week 4)
- 추가 shadcn 컴포넌트 (Command, Dialog, ScrollArea 등) — 필요 시 요구 발생 task에서 추가
