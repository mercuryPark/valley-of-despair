'use client';

import { Button } from '@/components/ui/button';
import { useMarkCompleted, useProgress } from '@/lib/hooks/use-progress';

export function MarkCompleted({ nodeSlug, userId }: { nodeSlug: string; userId: string }) {
  const { data } = useProgress(true);
  const { mutate, isPending } = useMarkCompleted(userId);
  const isCompleted = data?.some((p) => p.node_slug === nodeSlug && p.status === 'completed');

  return (
    <Button
      type="button"
      onClick={() => mutate(nodeSlug)}
      disabled={isCompleted || isPending}
      variant={isCompleted ? 'secondary' : 'default'}
      className="mt-8 w-full"
    >
      {isCompleted ? '● 완료한 노드' : '다 읽었음'}
    </Button>
  );
}
