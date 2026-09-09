-- Scorecard metrics
create table if not exists public.scorecard_metrics (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  metric_key text not null check (metric_key in ('students', 'schools', 'dollars_raised')),
  target numeric,
  actual numeric,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz default now(),
  unique(year, metric_key)
);
alter table public.scorecard_metrics enable row level security;
create policy "metrics_read" on public.scorecard_metrics for select to authenticated using (true);
create policy "metrics_all" on public.scorecard_metrics for all to authenticated using (true) with check (true);

-- Decisions
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  context text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at date not null default current_date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.decisions enable row level security;
create policy "decisions_read" on public.decisions for select to authenticated using (true);
create policy "decisions_insert" on public.decisions for insert to authenticated with check (auth.uid() = created_by);
create policy "decisions_update" on public.decisions for update to authenticated using (true);
create policy "decisions_delete" on public.decisions for delete to authenticated using (auth.uid() = created_by);

-- Meeting topics
create table if not exists public.meeting_topics (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  added_by uuid references public.profiles(id) on delete set null,
  done boolean not null default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);
alter table public.meeting_topics enable row level security;
create policy "topics_read" on public.meeting_topics for select to authenticated using (true);
create policy "topics_all" on public.meeting_topics for all to authenticated using (true) with check (true);
