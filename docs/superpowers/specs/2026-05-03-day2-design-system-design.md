# 2026-05-03 — Day 2 디자인 시스템 + 글로벌 레이아웃 설계

## 배경

ROADMAP.md 1주차 Day 2. 빈 Next.js 16 scaffold(Day 1 결과물) 위에 디자인 시스템과 글로벌 레이아웃을 얹는다.

**완료 기준**: Vercel prod 페이지가 Valley 톤(어두운 stone + Crimson Pro serif 헤딩 + amber accent)으로 보이고, 헤더·사이드바 슬롯·메인·풋터 4 영역이 grid로 잡혀 있으며, 다크/라이트 토글이 동작.

## 시각 방향성 — "Valley"

브레인스토밍 5개 결정:

1. **Atmosphere — Valley** (mood C). 어두운 stone 톤 + serif 헤딩 + 절제된 액센트. 책·노트 느낌.
2. **Dark default + Light optional**. Valley 디자인 정체성을 첫 인상으로 보존, 라이트 모드는 사용자 토글 시.
3. **헤딩 serif: Crimson Pro**. 책 느낌이 가장 진함. Google Fonts (`next/font/google`).
4. **Accent: amber-600** 1색만. 링크·완료 상태·호버. 책 표지 금박(gilt) 비유.
5. **Layout: Sidebar(L) + Main + Footer**. Header 상단. Week 3 사이드바 트리 슬롯, Week 4 TOC는 우측 추가 가능 — 단 Day 2엔 메인 max-w-3xl 가운데, 사이드바 빈 껍데기.

## 토큰 시스템 (Tailwind v4 `@theme inline`)

`src/app/globals.css`:

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

  /* shadcn 호환 (기존 토큰과 매핑) */
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

  /* sidebar (shadcn Sidebar 토큰) */
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
   `dark:` Tailwind variant이 .dark 클래스를 찾으므로 이 방향을 따른다.
   `defaultTheme="dark"`로 첫 로드 시 <html class="dark">가 적용 → Valley(어두운) 보임. */

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
  --primary: oklch(0.55 0.18 50); /* amber-700 */
  --primary-fg: oklch(0.985 0.002 60);
  --ring: oklch(0.55 0.18 50);
  --destructive: oklch(0.5 0.2 25);
}

.dark {
  /* dark tokens — Valley */
  --bg: oklch(0.14 0.005 60); /* stone-950 */
  --fg: oklch(0.985 0.002 60);
  --muted: oklch(0.22 0.005 60); /* stone-900 */
  --muted-fg: oklch(0.66 0.005 60); /* stone-400 */
  --border: oklch(0.27 0.005 60); /* stone-800 */
  --card: oklch(0.22 0.005 60);
  --card-fg: var(--fg);
  --sidebar-bg: oklch(0.18 0.005 60); /* stone-900 살짝 어둡게 */
  --primary: oklch(0.66 0.165 55); /* amber-600 */
  --primary-fg: oklch(0.14 0.005 60);
  --ring: oklch(0.66 0.165 55);
  --destructive: oklch(0.55 0.18 25);
}

body {
  font-family: var(--font-sans);
}
```

**근거**:

- **OKLCH** 색공간: Tailwind v4 권장. 지각적 균등(perceptually uniform) — 어두운 톤끼리 계조 정밀.
- **Stone hue=60**: 따뜻한 회색. Tailwind stone과 거의 동치.
- **단일 amber primary** (hue=55): warm hue 50~60대로 stone과 정렬.
- **light 모드 amber 어둡게**: 흰 배경 위 contrast를 위해 darker amber.
- **shadcn 토큰 매핑**: shadcn 컴포넌트가 참조하는 모든 토큰을 우리 변수로 위임 → init이 추가하는 default와 충돌해도 우리 값 우선.

## 폰트 로딩 (`next/font/google`, self-host)

`src/app/layout.tsx`:

```tsx
import { Geist, Geist_Mono, Crimson_Pro } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const crimsonPro = Crimson_Pro({
  variable: '--font-crimson-pro',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});
```

**근거**: `next/font/google`은 빌드 타임에 폰트 파일 self-host → CLS 0, FOUC 없음, GDPR 의무 없음.

## 테마 시스템 (`next-themes`)

```bash
pnpm add next-themes
```

`src/components/theme-provider.tsx` (client):

```tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';
export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

`src/app/layout.tsx`:

```tsx
<html lang="ko" suppressHydrationWarning className={fontVariables}>
  <body className="bg-background text-foreground min-h-screen font-sans antialiased">
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {/* ...AppShell... */}
    </ThemeProvider>
  </body>
</html>
```

**근거**:

- `attribute="class"` → `<html class="dark">` (Valley 활성) 또는 `<html class="light">` (light 활성, `.dark` 오버라이드 미적용 → :root 기본값 노출). shadcn `dark:` variant가 `.dark` 클래스를 찾는 표준 방식 따름.
- `defaultTheme="dark"` → Q2 결정.
- `enableSystem={false}` → OS 다크 추적 끔. dark 기본 + 사용자 명시 토글만 light.
- `suppressHydrationWarning` on `<html>` → next-themes 표준 (서버 SSR 시 클래스 없음 → 클라이언트 mount 후 클래스 적용 → mismatch warning 무시).
- `lang="ko"` → 콘텐츠 한국어 기본.

`metadata` 갱신:

```ts
export const metadata: Metadata = {
  title: 'valleyofdespair',
  description: 'FE 학습 플랫폼 — 렌더링·상태·성능·비동기',
};
```

## shadcn/ui 셋업

```bash
pnpm dlx shadcn@latest init
```

**대화형 답변**:

- TypeScript: yes
- Style: **new-york**
- Base color: **stone**
- CSS variables: yes
- React Server Components: yes
- Components alias: `@/components`
- Utils alias: `@/lib/utils`
- Icon library: **lucide**

**생성/수정**:

- `components.json` 신규
- `src/lib/utils.ts` 신규 (`cn()` 헬퍼)
- `src/app/globals.css` 수정됨 — shadcn이 자체 stone 토큰 추가. **수동 후속 작업**: 위 "토큰 시스템" 섹션의 `@theme inline` 블록과 `:root`/`.light`로 통합 (shadcn 기본값 위에 우리 Valley 토큰 덮어쓰기).

```bash
# 컴포넌트 5개 (ROADMAP 명시)
pnpm dlx shadcn@latest add button card sheet skeleton sidebar
```

**자동 추가 의존**: `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `@radix-ui/react-separator`, `@radix-ui/react-tooltip`, `lucide-react`.

**커스터마이즈**: 컴포넌트 코드 직접 수정 가능(shadcn은 source code copy 방식). Day 2엔 기본값 그대로, 추후 필요 시 변경.

## 글로벌 레이아웃

```
RootLayout (src/app/layout.tsx)
└─ ThemeProvider
   └─ SidebarProvider (defaultOpen)
      ├─ AppSidebar              (Week 3에 채움)
      └─ SidebarInset
         ├─ SiteHeader           (sticky top, h-12)
         ├─ <main max-w-3xl>     (children — page.tsx 내용)
         └─ SiteFooter           (border-top, h-16)
```

### 파일

| 경로                                    | 역할                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `src/components/layout/site-header.tsx` | 헤더: brand + sidebar trigger(모바일) + theme toggle                       |
| `src/components/layout/site-footer.tsx` | 풋터: copyright + GitHub 링크                                              |
| `src/components/layout/app-sidebar.tsx` | 사이드바 빈 껍데기 (Header/Content/Footer 슬롯만)                          |
| `src/components/theme-toggle.tsx`       | Moon/Sun 토글 (client, useTheme)                                           |
| `src/app/layout.tsx`                    | scaffold 기본 → ThemeProvider + SidebarProvider + Header/Inset/Footer 통합 |
| `src/app/page.tsx`                      | scaffold 광고 페이지 → valleyofdespair 인사 페이지로 교체                  |

### `site-header.tsx`

```tsx
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

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

### `app-sidebar.tsx` (빈 껍데기)

```tsx
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';

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

### `site-footer.tsx`

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

### `theme-toggle.tsx`

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

### `app/page.tsx` 교체

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

## 검증 체크

- `pnpm dev` http://localhost:3000:
  - [ ] 다크 기본, Valley 톤 확인
  - [ ] 헤더 sticky h-12, brand serif, theme toggle 작동
  - [ ] 사이드바 좌측 빈 칸 (border만)
  - [ ] 메인 max-w-3xl 가운데, h1이 Crimson Pro
  - [ ] 풋터 한 줄, GitHub 링크
  - [ ] theme toggle → light 모드 전환, refresh 후에도 유지(localStorage)
  - [ ] 모바일 (<768px): 사이드바 hidden, header에 햄버거 trigger 노출 → 클릭 시 Sheet로 열림
- `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build` 모두 통과
- Vercel preview/prod 페이지에서 동일 동작

## Out of scope (Day 3 이후)

- Supabase auth + progress 테이블 (Day 3)
- MDX 콘텐츠 파이프라인 (Day 4)
- 사이드바 노드 tree 실내용 (Week 3)
- 우측 TOC (Week 4)
- 검색 (Pagefind, Week 4)
- 헤더 anchor + 코드 하이라이팅 (Week 4)

## 가정 / 리스크

- **shadcn init이 globals.css 덮어쓸 가능성**: init 후 우리 `@theme inline` 블록이 살아있는지 확인 + 필요 시 수동 통합. → 구현 시 init 직후 globals.css 검증 단계 명시.
- **shadcn Sidebar의 v1 API 변경**: shadcn이 빠르게 진화 중. 컴포넌트 add 후 import 경로 검증.
- **Crimson Pro 한글 미지원**: 한글은 system fallback(예: Noto Sans KR이 없으면 Apple SD Gothic 등). 영문/숫자만 Crimson Pro 적용. 노드 콘텐츠는 한글 위주라 본문은 sans여도 OK.
- **theme toggle 첫 페이지 로드 깜빡임**: next-themes의 알려진 이슈. `suppressHydrationWarning`으로 console warn 제거하지만 시각 깜빡임 자체는 짧게 발생. 표준 트레이드오프, 수용.
