import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export async function AuthButton() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/sign-in">로그인</Link>
      </Button>
    );
  }

  return (
    <form action="/auth/sign-out" method="post">
      <Button size="sm" variant="ghost" type="submit">
        로그아웃
      </Button>
    </form>
  );
}
