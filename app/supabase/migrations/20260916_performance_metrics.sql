-- Real-user Core Web Vitals (LCP/CLS/INP/FCP/TTFB), reported anonymously from every non-admin
-- page load — see lib/performanceMetrics.ts and the new /admin/performance dashboard. Before
-- this, "the site is laggy" had no real data behind it; this lets the dashboard show whether a
-- perf fix (or a regression) actually moved anything for real visitors. Idempotent: safe to re-run.
create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  metric text not null check (metric in ('LCP', 'CLS', 'INP', 'FCP', 'TTFB')),
  value double precision not null check (value >= 0),
  rating text not null check (rating in ('good', 'needs-improvement', 'poor')),
  device text not null default 'desktop' check (device in ('mobile', 'desktop')),
  created_at timestamptz not null default now()
);

create index if not exists performance_metrics_created_at_idx on public.performance_metrics (created_at desc);

alter table public.performance_metrics enable row level security;

drop policy if exists "Anyone can report a performance metric" on public.performance_metrics;
create policy "Anyone can report a performance metric"
  on public.performance_metrics for insert with check (true);

drop policy if exists "Admins can read performance metrics" on public.performance_metrics;
create policy "Admins can read performance metrics"
  on public.performance_metrics for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete performance metrics" on public.performance_metrics;
create policy "Admins can delete performance metrics"
  on public.performance_metrics for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
