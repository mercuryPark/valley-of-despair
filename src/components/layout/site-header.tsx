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
