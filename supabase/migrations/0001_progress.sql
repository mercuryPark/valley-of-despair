-- Day 3: progress 테이블 + RLS
-- 실행 방법: Supabase 대시보드 → SQL Editor에 이 파일 전체를 붙여넣고 실행.

-- unread = 행 부재로 표현. 따라서 enum은 reading / completed 두 가지만.
create type public.progress_status as enum ('reading', 'completed');

create table public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_slug text not null,
  status public.progress_status not null default 'reading',
  updated_at timestamptz not null default now(),
  primary key (user_id, node_slug)
);

create index progress_user_id_idx on public.progress (user_id);

-- RLS
alter table public.progress enable row level security;

create policy "users can view own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "users can insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "users can update own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own progress"
  on public.progress for delete
  using (auth.uid() = user_id);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger progress_set_updated_at
  before update on public.progress
  for each row
  execute function public.set_updated_at();
