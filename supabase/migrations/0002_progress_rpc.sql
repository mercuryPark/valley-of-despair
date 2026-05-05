-- Day 6: mark_reading RPC
-- 실행 방법: Supabase 대시보드 → SQL Editor에 이 파일 전체 붙여넣고 실행.
-- 목적: 클라이언트 race로 completed→reading 회귀 차단.

create or replace function public.mark_reading(p_slug text)
returns void
language sql
security invoker
as $$
  insert into public.progress (user_id, node_slug, status)
  values (auth.uid(), p_slug, 'reading')
  on conflict (user_id, node_slug) do nothing;
$$;
