'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type Provider = 'google' | 'github';

export default function SignInPage() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const supabase = createClient();

  async function signIn(provider: Provider) {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(null);
      console.error(error);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-medium tracking-tight">로그인</h1>
        <p className="text-muted-foreground text-sm">
          진척도를 기기 간 동기화하려면 로그인하세요. 로그인 없이도 콘텐츠는 자유롭게 열람할 수
          있습니다.
        </p>
      </div>
      <div className="space-y-2">
        <Button className="w-full" disabled={loading !== null} onClick={() => signIn('google')}>
          {loading === 'google' ? '리다이렉트 중...' : 'Google로 계속'}
        </Button>
        <Button
          className="w-full"
          variant="outline"
          disabled={loading !== null}
          onClick={() => signIn('github')}
        >
          {loading === 'github' ? '리다이렉트 중...' : 'GitHub로 계속'}
        </Button>
      </div>
    </div>
  );
}
