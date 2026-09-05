-- Runtime-published nail geometry. Static coordinates.json files remain the fallback.
create table if not exists public.nail_geometry_variants (
  tone text not null check (tone in ('cozy', 'matcha')),
  shape text not null check (shape in ('oval', 'square', 'coffin', 'almond')),
  length text not null check (length in ('S', 'M', 'L')),
  coordinates jsonb not null
    check (jsonb_typeof(coordinates) = 'object')
    check (jsonb_typeof(coordinates -> 'nails') = 'array')
    check (jsonb_array_length(coordinates -> 'nails') = 5),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (tone, shape, length)
);

alter table public.nail_geometry_variants enable row level security;

create or replace function public.is_vibeu_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_vibeu_admin() from public;
grant execute on function public.is_vibeu_admin() to authenticated;

drop policy if exists "nail geometry is publicly readable" on public.nail_geometry_variants;
create policy "nail geometry is publicly readable"
on public.nail_geometry_variants for select
to anon, authenticated
using (true);

drop policy if exists "admins can insert nail geometry" on public.nail_geometry_variants;
create policy "admins can insert nail geometry"
on public.nail_geometry_variants for insert
to authenticated
with check (public.is_vibeu_admin() and updated_by = auth.uid());

drop policy if exists "admins can update nail geometry" on public.nail_geometry_variants;
create policy "admins can update nail geometry"
on public.nail_geometry_variants for update
to authenticated
using (public.is_vibeu_admin())
with check (public.is_vibeu_admin() and updated_by = auth.uid());
