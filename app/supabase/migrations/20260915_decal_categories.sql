-- New "decal_categories" table: the canonical, admin-manageable pick-list for
-- decals.category/category_vi (previously just free-typed per decal, duplicated across ~520
-- rows). Seeds the 20 categories already in use by the migrated decal library (see
-- 20260915_seed_decals.sql) so nothing changes for existing decals. Idempotent: safe to re-run.
create table if not exists public.decal_categories (
  id text primary key,
  name_vi text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.decal_categories enable row level security;

drop policy if exists "Decal categories are viewable by everyone" on public.decal_categories;
create policy "Decal categories are viewable by everyone"
  on public.decal_categories for select using (true);

drop policy if exists "Admins manage decal categories" on public.decal_categories;
create policy "Admins manage decal categories"
  on public.decal_categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

insert into public.decal_categories (id, name_vi) values
  ('floral', 'Hoa & trái cây'),
  ('hearts', 'Trái tim & Valentine'),
  ('celestial', 'Ngôi sao & mặt trăng'),
  ('butterfly', 'Bướm & côn trùng'),
  ('bows', 'Nơ & phụ kiện coquette'),
  ('animal-print', 'Họa tiết da thú'),
  ('geometric', 'Hình học & đường nét'),
  ('foil-abstract', 'Foil & trừu tượng'),
  ('fruit', 'Trái cây'),
  ('seasonal', 'Mùa & thời tiết'),
  ('text-symbols', 'Chữ & ký hiệu'),
  ('gems', 'Đá quý & Charm đá quý'),
  ('misc', 'Khác'),
  ('desserts', 'Bánh & đồ ngọt'),
  ('cute-animals', 'Thú cưng dễ thương'),
  ('vanity-accessories', 'Phụ kiện trang điểm'),
  ('christmas-winter', 'Giáng sinh & mùa đông'),
  ('gothic-halloween', 'Halloween & gothic ngọt ngào'),
  ('tet-lunar-new-year', 'Tết & năm mới'),
  ('mid-autumn', 'Trung thu')
on conflict (id) do nothing;
