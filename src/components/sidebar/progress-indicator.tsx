'use client';

import { useProgress } from '@/lib/hooks/use-progress';

const LABEL = {
  unread: { glyph: '○', srText: '읽지 않음' },
  reading: { glyph: '◐', srText: '읽는 중' },
  completed: { glyph: '●', srText: '완료' },
} as const;

export function ProgressIndicator({ nodeSlug, enabled }: { nodeSlug: string; enabled: boolean }) {
  const { data } = useProgress(enabled);
  if (!enabled) return null;
  const row = data?.find((p) => p.node_slug === nodeSlug);
  const key: keyof typeof LABEL = row ? row.status : 'unread';
  const { glyph, srText } = LABEL[key];
  return (
    <span
      aria-label={srText}
      className="text-muted-foreground inline-block w-4 text-center text-xs"
    >
      {glyph}
    </span>
  );
}
