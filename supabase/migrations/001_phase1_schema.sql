-- Box United OS Phase 1 Schema
-- Apply to project kfdyvfxkguhcydbjyjgt

-- ============================================================
-- Profiles (mirrors auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text default 'member',
  created_at  timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Rocks (quarterly goals, max 3 per person per quarter)
-- ============================================================
create table if not exists public.rocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'on-track' check (status in ('on-track', 'off-track', 'done')),
  quarter     text not null,  -- e.g. "Q3 2026"
  due_date    date,
  created_at  timestamptz default now()
);

-- Enforce max 3 rocks per user per quarter
create or replace function public.check_max_rocks()
returns trigger language plpgsql as $$
begin
  if (
    select count(*) from public.rocks
    where user_id = new.user_id and quarter = new.quarter
  ) >= 3 then
    raise exception 'Maximum 3 rocks per quarter reached';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_max_rocks on public.rocks;
create trigger enforce_max_rocks
  before insert on public.rocks
  for each row execute procedure public.check_max_rocks();

-- ============================================================
-- Tasks (personal, with frequency)
-- ============================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  frequency   text not null check (frequency in ('daily', 'weekly', 'monthly')),
  completed   boolean not null default false,
  due_date    date,
  created_at  timestamptz default now()
);

-- ============================================================
-- Team Tasks (cross-assignment)
-- ============================================================
create table if not exists public.team_tasks (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title       text not null,
  description text,
  status      text not null default 'todo' check (status in ('todo', 'in-progress', 'done')),
  due_date    date,
  created_at  timestamptz default now()
);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.rocks     enable row level security;
alter table public.tasks     enable row level security;
alter table public.team_tasks enable row level security;

-- Profiles: all authenticated users can read; own row write
create policy "profiles_read"  on public.profiles for select to authenticated using (true);
create policy "profiles_write" on public.profiles for all    to authenticated using (auth.uid() = id);

-- Rocks: own rows only
create policy "rocks_all" on public.rocks for all to authenticated using (auth.uid() = user_id);

-- Tasks: own rows only
create policy "tasks_all" on public.tasks for all to authenticated using (auth.uid() = user_id);

-- Team tasks: all authenticated users can read/write
create policy "team_tasks_read"   on public.team_tasks for select to authenticated using (true);
create policy "team_tasks_insert" on public.team_tasks for insert to authenticated with check (auth.uid() = created_by);
create policy "team_tasks_update" on public.team_tasks for update to authenticated using (true);
create policy "team_tasks_delete" on public.team_tasks for delete to authenticated using (auth.uid() = created_by);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists rocks_user_quarter   on public.rocks     (user_id, quarter);
create index if not exists tasks_user_frequency on public.tasks     (user_id, frequency);
create index if not exists team_tasks_assigned  on public.team_tasks (assigned_to);
create index if not exists team_tasks_created   on public.team_tasks (created_by);
