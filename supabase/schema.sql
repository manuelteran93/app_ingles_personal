create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  total_points integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_practice_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint username_length check (char_length(username) between 3 and 24)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id integer not null,
  phrase_id text not null,
  status text not null,
  srs_level integer not null default 0,
  next_review_date date,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_progress_status_check check (status in ('learned', 'reviewing')),
  constraint user_progress_unique unique (user_id, module_id, phrase_id)
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id integer not null,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  points_earned integer not null default 0,
  completed_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  constraint friendships_status_check check (status in ('pending', 'accepted')),
  constraint friendships_not_self check (user_id <> friend_id)
);

alter table public.user_progress add column if not exists srs_level int default 0;
alter table public.user_progress add column if not exists next_review_date date;

create unique index if not exists friendships_unique_pair_idx
  on public.friendships ((least(user_id, friend_id)), (greatest(user_id, friend_id)));

create index if not exists profiles_points_idx on public.profiles (total_points desc);
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists user_progress_user_module_idx on public.user_progress (user_id, module_id);
create index if not exists quiz_results_user_module_idx on public.quiz_results (user_id, module_id);
create index if not exists friendships_user_idx on public.friendships (user_id, status);
create index if not exists friendships_friend_idx on public.friendships (friend_id, status);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := coalesce(
    nullif(lower(new.raw_user_meta_data ->> 'username'), ''),
    lower(split_part(new.email, '@', 1)) || '_' || left(new.id::text, 8)
  );

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    generated_username,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
before update on public.user_progress
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.quiz_results enable row level security;
alter table public.friendships enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "user_progress_select_own" on public.user_progress;
drop policy if exists "user_progress_insert_own" on public.user_progress;
drop policy if exists "user_progress_update_own" on public.user_progress;
drop policy if exists "user_progress_delete_own" on public.user_progress;
drop policy if exists "quiz_results_select_own" on public.quiz_results;
drop policy if exists "quiz_results_insert_own" on public.quiz_results;
drop policy if exists "friendships_select_related" on public.friendships;
drop policy if exists "friendships_insert_sender" on public.friendships;
drop policy if exists "friendships_update_recipient" on public.friendships;
drop policy if exists "friendships_delete_related" on public.friendships;

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "user_progress_select_own"
  on public.user_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_progress_insert_own"
  on public.user_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_progress_update_own"
  on public.user_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_progress_delete_own"
  on public.user_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_results_select_own"
  on public.quiz_results
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_results_insert_own"
  on public.quiz_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "friendships_select_related"
  on public.friendships
  for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "friendships_insert_sender"
  on public.friendships
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "friendships_update_recipient"
  on public.friendships
  for update
  to authenticated
  using (auth.uid() = friend_id)
  with check (auth.uid() = friend_id);

create policy "friendships_delete_related"
  on public.friendships
  for delete
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception
    when duplicate_object then
      null;
  end;

  begin
    alter publication supabase_realtime add table public.friendships;
  exception
    when duplicate_object then
      null;
  end;
end
$$;
