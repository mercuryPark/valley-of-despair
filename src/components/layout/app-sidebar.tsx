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
