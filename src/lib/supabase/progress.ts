import type { SupabaseClient } from '@supabase/supabase-js';

export type ProgressStatus = 'reading' | 'completed';

export type ProgressRow = {
  node_slug: string;
  status: ProgressStatus;
  updated_at: string;
};

export async function getProgress(client: SupabaseClient): Promise<ProgressRow[]> {
  const { data, error } = await client.from('progress').select('node_slug, status, updated_at');
  if (error) throw error;
  return data ?? [];
}

export async function markReading(client: SupabaseClient, nodeSlug: string): Promise<void> {
  const { error } = await client.rpc('mark_reading', { p_slug: nodeSlug });
  if (error) throw error;
}

export async function markCompleted(
  client: SupabaseClient,
  nodeSlug: string,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from('progress')
    .upsert({ user_id: userId, node_slug: nodeSlug, status: 'completed' });
  if (error) throw error;
}
