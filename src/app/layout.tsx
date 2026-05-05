import type { Metadata } from 'next';
import { Crimson_Pro, Geist, Geist_Mono } from 'next/font/google';

import { PostHogProvider } from '@/components/analytics/posthog-provider';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
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
          <PostHogProvider>
            <QueryProvider>
              <SidebarProvider defaultOpen>
                <AppSidebar />
                <SidebarInset className="flex min-h-screen flex-col">
                  <SiteHeader />
                  <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">{children}</main>
                  <SiteFooter />
                </SidebarInset>
              </SidebarProvider>
            </QueryProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
