import Link from 'next/link';

import { AuthButton } from '@/components/layout/auth-button';
import { SearchTrigger } from '@/components/search/search-trigger';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { listPublishedNodes } from '@/lib/content/loader';

export async function SiteHeader() {
  const nodes = await listPublishedNodes();
  return (
    <header className="border-border bg-background sticky top-0 z-30 flex h-12 items-center gap-3 border-b px-4">
      <SidebarTrigger className="md:hidden" />
      <Link href="/" className="font-serif text-base font-medium tracking-tight">
        valleyofdespair
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <SearchTrigger nodes={nodes} />
        <AuthButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
