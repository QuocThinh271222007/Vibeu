-- New "Mục lục" (blog series) entity: a named collection admins create/manage in /admin,
-- then attach ("gắn") to specific blog posts, so the blog listing can filter by it. Not a
-- per-post in-page heading outline (that's the existing auto-generated table of contents on
-- BlogPost.tsx) — this groups multiple posts together, like a lightweight second category.
-- Idempotent: safe to re-run.
create table if not exists public.blog_series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_series enable row level security;

drop policy if exists "Blog series are viewable by everyone" on public.blog_series;
create policy "Blog series are viewable by everyone"
  on public.blog_series for select using (true);

drop policy if exists "Admins manage blog series" on public.blog_series;
create policy "Admins manage blog series"
  on public.blog_series for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

alter table public.blog_posts add column if not exists series_id uuid references public.blog_series (id) on delete set null;
