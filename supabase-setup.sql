-- =============================================
-- PIPOCAMAX DATABASE SETUP
-- Execute this in Supabase SQL Editor
-- =============================================

-- 1. User roles enum and table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- RLS: only admins can read roles
create policy "Admins can read roles"
  on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles readable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Movies table
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  original_title text,
  overview text,
  year text,
  genre text,
  rating numeric(3,1) default 0,
  image_url text,
  backdrop_url text,
  tmdb_id integer unique,
  release_date text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.movies enable row level security;

create policy "Movies publicly readable"
  on public.movies for select using (true);

create policy "Admins can insert movies"
  on public.movies for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update movies"
  on public.movies for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete movies"
  on public.movies for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 4. Series table
create table public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  original_title text,
  overview text,
  year text,
  genre text,
  rating numeric(3,1) default 0,
  image_url text,
  backdrop_url text,
  tmdb_id integer unique,
  first_air_date text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.series enable row level security;

create policy "Series publicly readable"
  on public.series for select using (true);

create policy "Admins can insert series"
  on public.series for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update series"
  on public.series for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete series"
  on public.series for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 5. Insert admin role for the created user
insert into public.user_roles (user_id, role)
values ('92942fd0-4f94-40f7-a122-5df1e4a48c0f', 'admin');

-- 6. Insert profile for admin (trigger may not fire for existing user)
insert into public.profiles (id, email, display_name)
values ('92942fd0-4f94-40f7-a122-5df1e4a48c0f', 'envisionxgroup@gmail.com', 'Admin')
on conflict (id) do nothing;
