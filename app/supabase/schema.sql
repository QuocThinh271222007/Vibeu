-- VIBEU Supabase schema
-- Run this whole file once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent (create-if-not-exists / drop-then-create).

-- =========================================================================
-- profiles — one row per auth.users row, holds display/role data the client
-- is allowed to read (auth.users itself is never queryable from the browser).
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default 'Người dùng VIBEU',
  handle text,
  avatar_color text not null default '#90B8EB',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Lets an admin promote/demote other accounts from the /admin Users tab.
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Auto-create a profile row the moment someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, handle, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'handle', '@' || split_part(new.email, '@', 1)),
    (array['#90B8EB', '#FF92F9', '#FFD879', '#8CCABD', '#B6A6E5', '#F4B094'])[floor(random() * 6 + 1)]
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- The "update own profile" policy above restricts which ROW a user may touch, not which
-- COLUMN — without this trigger any signed-in user could self-promote by calling
-- profiles.update({ role: 'admin' }) on their own row. Only an existing admin (checked here,
-- not via the trigger's own privileges) may change role; anyone else's attempted change is
-- silently reverted rather than erroring the whole request.
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role and not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- =========================================================================
-- community_posts — user-generated "I made this" posts on the Community page.
-- =========================================================================
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id text,
  caption text not null default '',
  hashtags text[] not null default '{}',
  media_url text,
  media_alt text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;

drop policy if exists "Community posts are viewable by everyone" on public.community_posts;
create policy "Community posts are viewable by everyone"
  on public.community_posts for select using (true);

drop policy if exists "Authenticated users can create their own posts" on public.community_posts;
create policy "Authenticated users can create their own posts"
  on public.community_posts for insert with check (auth.uid() = user_id);

drop policy if exists "Owners or admins can update posts" on public.community_posts;
create policy "Owners or admins can update posts"
  on public.community_posts for update using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Owners or admins can delete posts" on public.community_posts;
create policy "Owners or admins can delete posts"
  on public.community_posts for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Per-user like tracking (so a like survives a refresh / doesn't double-count).
create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_likes enable row level security;

drop policy if exists "Likes are viewable by everyone" on public.community_likes;
create policy "Likes are viewable by everyone"
  on public.community_likes for select using (true);

drop policy if exists "Users can like as themselves" on public.community_likes;
create policy "Users can like as themselves"
  on public.community_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own like" on public.community_likes;
create policy "Users can remove their own like"
  on public.community_likes for delete using (auth.uid() = user_id);

-- Keep community_posts.likes_count in sync without a round-trip from the client.
create or replace function public.handle_like_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_like_change on public.community_likes;
create trigger on_like_change
  after insert or delete on public.community_likes
  for each row execute procedure public.handle_like_change();

-- The "owners or admins can update posts" policy lets an owner edit their own post's caption —
-- but with no column restriction it would also let them hand-set likes_count/comments_count
-- directly (faking popularity), bypassing the trigger above. Non-admin changes to these two
-- columns are silently reverted; only handle_like_change() (which reaches this table through a
-- nested trigger call, detected via pg_trigger_depth() > 1) or an admin may change them.
create or replace function public.protect_community_counts()
returns trigger as $$
begin
  if (new.likes_count is distinct from old.likes_count or new.comments_count is distinct from old.comments_count)
     and pg_trigger_depth() <= 1
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    new.likes_count := old.likes_count;
    new.comments_count := old.comments_count;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_community_counts_trigger on public.community_posts;
create trigger protect_community_counts_trigger
  before update on public.community_posts
  for each row execute procedure public.protect_community_counts();

-- =========================================================================
-- blog_posts — editorial posts, created/edited only from /admin.
-- =========================================================================
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'tips' check (category in ('tips', 'trend', 'care')),
  excerpt text not null default '',
  content text[] not null default '{}',
  accent_color text not null default '#B6C7EA',
  cover_src text,
  cover_alt text,
  author_id uuid references public.profiles (id) on delete set null,
  published boolean not null default true,
  read_minutes int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

drop policy if exists "Published posts are viewable by everyone" on public.blog_posts;
create policy "Published posts are viewable by everyone"
  on public.blog_posts for select using (
    published or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins manage blog posts" on public.blog_posts;
create policy "Admins manage blog posts"
  on public.blog_posts for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =========================================================================
-- Storage bucket for user-uploaded community photos.
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read community media" on storage.objects;
create policy "Public read community media"
  on storage.objects for select using (bucket_id = 'community-media');

drop policy if exists "Authenticated users can upload community media" on storage.objects;
create policy "Authenticated users can upload community media"
  on storage.objects for insert with check (bucket_id = 'community-media' and auth.role() = 'authenticated');

drop policy if exists "Owners can delete their community media" on storage.objects;
create policy "Owners can delete their community media"
  on storage.objects for delete using (bucket_id = 'community-media' and owner = auth.uid());

-- =========================================================================
-- After running this file: promote your own account to admin so /admin
-- unlocks. Replace the email, then run separately:
-- =========================================================================
-- update public.profiles set role = 'admin' where email = 'your-account@example.com';
