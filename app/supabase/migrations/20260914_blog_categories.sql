-- Turns the blog's category taxonomy ("Danh mục": Mẹo làm đẹp / Trend móng mới / Hướng dẫn
-- dưỡng móng) from a hardcoded 3-value TypeScript union + a DB check constraint into
-- admin-manageable data, same pattern as blog_series ("Mục lục"). blog_posts.category stays a
-- plain text column (no FK) — this table just holds the canonical slug -> display-name list,
-- seeded with the 3 existing categories so nothing changes for current posts. Idempotent.
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_categories enable row level security;

drop policy if exists "Blog categories are viewable by everyone" on public.blog_categories;
create policy "Blog categories are viewable by everyone"
  on public.blog_categories for select using (true);

drop policy if exists "Admins manage blog categories" on public.blog_categories;
create policy "Admins manage blog categories"
  on public.blog_categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

insert into public.blog_categories (slug, name) values
  ('tips', 'Mẹo làm đẹp'),
  ('trend', 'Trend móng mới'),
  ('care', 'Hướng dẫn dưỡng móng')
on conflict (slug) do nothing;

-- category is now a dynamic slug into blog_categories, not one of a hardcoded 3 values.
alter table public.blog_posts drop constraint if exists blog_posts_category_check;
