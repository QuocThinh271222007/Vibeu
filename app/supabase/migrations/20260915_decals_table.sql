-- New "decals" table backing the Charm/sticker library (Thư viện Charm) — public read,
-- admin-only write/CRUD from the new /admin/decals page. Run this BEFORE
-- 20260915_seed_decals.sql (the one-time migration of the ~520 existing built-in decals into
-- this table). Idempotent: safe to re-run.
create table if not exists public.decals (
  id text primary key,
  name text not null,
  name_vi text not null,
  category text not null,
  category_vi text not null,
  tags text[] not null default '{}',
  path text not null,
  thumbnail text,
  view_box_w numeric not null default 100,
  view_box_h numeric not null default 100,
  content_bounds numeric[] not null default '{0,0,1,1}',
  default_scale numeric not null default 0.6,
  tintable boolean not null default false,
  layer_type text not null default 'decal' check (layer_type in ('decal', 'foil', 'raised')),
  style text,
  source text not null default '',
  license text not null default '',
  tier text not null default 'standard' check (tier in ('standard', 'premium')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.decals enable row level security;

drop policy if exists "Decals are viewable by everyone" on public.decals;
create policy "Decals are viewable by everyone"
  on public.decals for select using (true);

drop policy if exists "Admins manage decals" on public.decals;
create policy "Admins manage decals"
  on public.decals for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('decal-assets', 'decal-assets', true, 4194304, array['image/svg+xml', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read decal assets" on storage.objects;
create policy "Public read decal assets"
  on storage.objects for select using (bucket_id = 'decal-assets');

drop policy if exists "Admins can upload decal assets" on storage.objects;
create policy "Admins can upload decal assets"
  on storage.objects for insert with check (
    bucket_id = 'decal-assets' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete decal assets" on storage.objects;
create policy "Admins can delete decal assets"
  on storage.objects for delete using (
    bucket_id = 'decal-assets' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
