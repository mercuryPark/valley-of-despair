import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function LoginPrompt() {
  return (
    <div className="border-border space-y-2 border-t px-3 py-3 text-xs">
      <p className="text-muted-foreground">로그인하면 진척도 추적</p>
      <Button asChild size="sm" className="w-full">
        <Link href="/auth/sign-in">로그인</Link>
      </Button>
    </div>
  );
}
