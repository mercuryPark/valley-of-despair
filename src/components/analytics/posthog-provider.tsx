'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { getPostHog } from '@/lib/posthog/client';

function PageViewTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ph = getPostHog();
    if (!ph || !pathname) return;

    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    ph.capture('$pageview', { $current_url: window.location.origin + url });
  }, [pathname, searchParams]);

  return null;
}

function IdentitySync(): null {
  useEffect(() => {
    const ph = getPostHog();
    if (!ph) return;

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        ph.identify(user.id, { email: user.email ?? undefined });
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        ph.identify(session.user.id, { email: session.user.email ?? undefined });
      } else if (event === 'SIGNED_OUT') {
        ph.reset();
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  useEffect(() => {
    getPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <IdentitySync />
      {children}
    </>
  );
}
