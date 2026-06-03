-- =============================================
-- PIPOCAMAX — Watchlist (Minha Lista)
-- Executar no Supabase SQL Editor
-- =============================================

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content_id uuid not null,
  content_type text not null check (content_type in ('movie','series')),
  title text not null,
  image_url text,
  year text,
  rating numeric default 0,
  created_at timestamptz default now(),
  unique (user_id, content_id, content_type)
);

grant select, insert, update, delete on public.watchlist to authenticated;
grant all on public.watchlist to service_role;

alter table public.watchlist enable row level security;

create policy "Users manage own watchlist - select"
  on public.watchlist for select to authenticated
  using (auth.uid() = user_id);

create policy "Users manage own watchlist - insert"
  on public.watchlist for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users manage own watchlist - delete"
  on public.watchlist for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists watchlist_user_idx on public.watchlist(user_id, created_at desc);
