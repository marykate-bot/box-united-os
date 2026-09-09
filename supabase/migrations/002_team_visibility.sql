-- Box United OS – Phase 2: Team visibility + Annual Goals
-- Apply to project kfdyvfxkguhcydbjyjgt

-- ============================================================
-- Split rocks policy: read for all authenticated, write for own
-- ============================================================
drop policy if exists "rocks_all" on public.rocks;

create policy "rocks_team_read" on public.rocks
  for select to authenticated using (true);

create policy "rocks_own_write" on public.rocks
  for insert to authenticated with check (auth.uid() = user_id);

create policy "rocks_own_update" on public.rocks
  for update to authenticated using (auth.uid() = user_id);

create policy "rocks_own_delete" on public.rocks
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Split tasks policy: read for all authenticated, write for own
-- ============================================================
drop policy if exists "tasks_all" on public.tasks;

create policy "tasks_team_read" on public.tasks
  for select to authenticated using (true);

create policy "tasks_own_write" on public.tasks
  for insert to authenticated with check (auth.uid() = user_id);

create policy "tasks_own_update" on public.tasks
  for update to authenticated using (auth.uid() = user_id);

create policy "tasks_own_delete" on public.tasks
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Annual Goals (shared team goals)
-- ============================================================
create table if not exists public.annual_goals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'not-started'
                check (status in ('not-started', 'in-progress', 'on-track', 'done')),
  year        integer not null default extract(year from now())::integer,
  owner_id    uuid references public.profiles(id) on delete set null,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now()
);

alter table public.annual_goals enable row level security;

create policy "annual_goals_read" on public.annual_goals
  for select to authenticated using (true);

create policy "annual_goals_insert" on public.annual_goals
  for insert to authenticated with check (auth.uid() = created_by);

create policy "annual_goals_update" on public.annual_goals
  for update to authenticated using (true);

create policy "annual_goals_delete" on public.annual_goals
  for delete to authenticated using (auth.uid() = created_by);

-- Indexes
create index if not exists annual_goals_year      on public.annual_goals (year);
create index if not exists annual_goals_owner     on public.annual_goals (owner_id);
create index if not exists annual_goals_created   on public.annual_goals (created_by);
