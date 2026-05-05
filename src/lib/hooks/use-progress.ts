'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import { getProgress, markCompleted, markReading, type ProgressRow } from '@/lib/supabase/progress';

const QUERY_KEY = ['progress'] as const;

export function useProgress(enabled: boolean) {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getProgress(supabase),
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useMarkReading() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => markReading(supabase, slug),
    onMutate: async (slug) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData<ProgressRow[]>(QUERY_KEY) ?? [];
      const exists = prev.some((p) => p.node_slug === slug);
      if (!exists) {
        qc.setQueryData<ProgressRow[]>(QUERY_KEY, [
          ...prev,
          { node_slug: slug, status: 'reading', updated_at: new Date().toISOString() },
        ]);
      }
      return { prev };
    },
    onError: (_err, _slug, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
    },
  });
}

export function useMarkCompleted(userId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => markCompleted(supabase, slug, userId),
    onMutate: async (slug) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData<ProgressRow[]>(QUERY_KEY) ?? [];
      const next = prev.some((p) => p.node_slug === slug)
        ? prev.map((p) =>
            p.node_slug === slug
              ? { ...p, status: 'completed' as const, updated_at: new Date().toISOString() }
              : p,
          )
        : [
            ...prev,
            {
              node_slug: slug,
              status: 'completed' as const,
              updated_at: new Date().toISOString(),
            },
          ];
      qc.setQueryData<ProgressRow[]>(QUERY_KEY, next);
      return { prev };
    },
    onError: (_err, _slug, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
    },
  });
}
