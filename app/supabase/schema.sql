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
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Added after the initial release — safe no-op if the column already exists.
alter table public.profiles add column if not exists avatar_url text;

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
-- v2: also refuses to demote the last remaining admin (even another admin can't strand the
-- site with zero admins — they'd have to promote someone else first).
-- v3: auth.uid() is NULL when this runs with no JWT context at all — i.e. from the Supabase
-- SQL Editor or any service-role/migration script, which is exactly how you bootstrap your
-- first admin (see the "update ... where email = ..." command at the bottom of this file).
-- v1/v2 treated that the same as an anonymous stranger and silently reverted it, permanently
-- breaking the documented bootstrap flow. Only a real authenticated *non-admin* request
-- (auth.uid() is not null but isn't an admin) should be blocked.
create or replace function public.protect_profile_role()
returns trigger as $$
declare
  actor_is_admin boolean;
  remaining_admins int;
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null then
      select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') into actor_is_admin;
      if not actor_is_admin then
        new.role := old.role;
        return new;
      end if;
    end if;
    if old.role = 'admin' and new.role <> 'admin' then
      select count(*) into remaining_admins from public.profiles where role = 'admin';
      if remaining_admins <= 1 then
        new.role := old.role;
      end if;
    end if;
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
  user_id uuid references public.profiles (id) on delete cascade,
  template_id text,
  caption text not null default '',
  hashtags text[] not null default '{}',
  media_url text,
  media_alt text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  featured boolean not null default false,
  approved boolean not null default false,
  guest_name text,
  guest_handle text,
  guest_avatar_color text,
  created_at timestamptz not null default now()
);

-- Added after the initial release — safe no-op if the column already exists.
alter table public.community_posts add column if not exists featured boolean not null default false;

-- Added for admin moderation: existing posts backfill as already-approved (default true), then the
-- column default flips to false so every *new* post starts hidden until an admin approves it.
alter table public.community_posts add column if not exists approved boolean not null default true;
alter table public.community_posts alter column approved set default false;

-- Added to migrate the old hardcoded demo posts (src/data/community.ts) into real rows the admin
-- can edit/delete: those have no auth.users account behind them, so user_id must be nullable, and
-- the guest_* columns stand in for the profiles join (display_name/handle/avatar_color) when null.
alter table public.community_posts alter column user_id drop not null;
alter table public.community_posts add column if not exists guest_name text;
alter table public.community_posts add column if not exists guest_handle text;
alter table public.community_posts add column if not exists guest_avatar_color text;

alter table public.community_posts enable row level security;

drop policy if exists "Community posts are viewable by everyone" on public.community_posts;
create policy "Community posts are viewable by everyone"
  on public.community_posts for select using (
    approved
    or auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

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
-- `featured` and `approved` get the same treatment: only an admin may pin or approve a post,
-- never the owner (otherwise a user could just flip their own post's approved flag back to true).
create or replace function public.protect_community_counts()
returns trigger as $$
begin
  if (new.likes_count is distinct from old.likes_count
      or new.comments_count is distinct from old.comments_count
      or new.featured is distinct from old.featured
      or new.approved is distinct from old.approved)
     and pg_trigger_depth() <= 1
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    new.likes_count := old.likes_count;
    new.comments_count := old.comments_count;
    new.featured := old.featured;
    new.approved := old.approved;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_community_counts_trigger on public.community_posts;
create trigger protect_community_counts_trigger
  before update on public.community_posts
  for each row execute procedure public.protect_community_counts();

-- The insert policy above only checks auth.uid() = user_id — nothing stops a client from also
-- setting approved: true directly in the insert payload (the app's UI never does, but a raw API
-- call could). This decides `approved` server-side instead, ignoring whatever the client sent:
-- admins always publish immediately; everyone else follows the site-wide moderation toggle.
create or replace function public.set_community_post_approved()
returns trigger as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and role = 'admin') then
    new.approved := true;
  else
    new.approved := not coalesce((select community_moderation from public.site_settings where id = true), true);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists set_community_post_approved_trigger on public.community_posts;
create trigger set_community_post_approved_trigger
  before insert on public.community_posts
  for each row execute procedure public.set_community_post_approved();

-- Indexes for the query patterns the social-network UI actually runs: a user's own post
-- history (profile page), newest-first feed, and hashtag search — full table scans before this.
create index if not exists community_posts_user_id_idx on public.community_posts (user_id);
create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_hashtags_idx on public.community_posts using gin (hashtags);

-- =========================================================================
-- community_comments — real threaded-by-post comments (the old comments_count column used
-- to have no writer at all; this is what actually populates it now).
-- =========================================================================
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_id_idx on public.community_comments (post_id, created_at);

alter table public.community_comments enable row level security;

drop policy if exists "Comments are viewable if the post is" on public.community_comments;
create policy "Comments are viewable if the post is"
  on public.community_comments for select using (
    exists (
      select 1 from public.community_posts p
      where p.id = post_id
        and (p.approved or p.user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

drop policy if exists "Authenticated users can comment as themselves" on public.community_comments;
create policy "Authenticated users can comment as themselves"
  on public.community_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Owners or admins can delete comments" on public.community_comments;
create policy "Owners or admins can delete comments"
  on public.community_comments for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Mirrors handle_like_change below — keeps community_posts.comments_count in sync without a
-- round-trip from the client, and without needing comments to be updatable (no update policy
-- exists, so a comment's content and its post/author are immutable once posted).
create or replace function public.handle_comment_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_comment_change on public.community_comments;
create trigger on_comment_change
  after insert or delete on public.community_comments
  for each row execute procedure public.handle_comment_change();

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
  -- Ordered rich content: [{type:'paragraph'|'heading2'|'heading3', text} | {type:'image', src, alt, caption}].
  -- `content` (above) is kept as a plain-text mirror (paragraph/heading text only) for any
  -- simple text search, but content_blocks is what BlogPost.tsx actually renders.
  content_blocks jsonb not null default '[]'::jsonb,
  meta_description text not null default '',
  primary_keyword text not null default '',
  secondary_keyword text not null default '',
  -- Closing credit line per the writing template ("Bài viết và hình ảnh được thực hiện bởi
  -- [tên doanh nghiệp]") — editable per post since a future post could credit a different
  -- photographer/collaborator, though every post today keeps the same VIBEU default.
  credit_line text not null default 'Bài viết và hình ảnh được thực hiện bởi VIBEU',
  accent_color text not null default '#B6C7EA',
  cover_src text,
  cover_alt text,
  author_id uuid references public.profiles (id) on delete set null,
  published boolean not null default true,
  read_minutes int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Added after the initial release — safe no-op if the columns already exist.
alter table public.blog_posts add column if not exists content_blocks jsonb not null default '[]'::jsonb;
alter table public.blog_posts add column if not exists meta_description text not null default '';
alter table public.blog_posts add column if not exists primary_keyword text not null default '';
alter table public.blog_posts add column if not exists secondary_keyword text not null default '';
alter table public.blog_posts add column if not exists credit_line text not null default 'Bài viết và hình ảnh được thực hiện bởi VIBEU';

-- One-time backfill: turn each existing plain paragraph into a paragraph block, so posts
-- written before content_blocks existed still render via the new block-based path.
update public.blog_posts set content_blocks = (
  select coalesce(jsonb_agg(jsonb_build_object('type', 'paragraph', 'text', p)), '[]'::jsonb)
  from unnest(content) as p
) where content_blocks = '[]'::jsonb and coalesce(array_length(content, 1), 0) > 0;

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
-- templates — Thư viện mẫu. Public read (Library/Studio "Dùng mẫu này"),
-- admin-only write. `fingers` is the same Record<FingerId, FingerDesign>
-- shape Studio's own store uses, saved verbatim via "Lưu làm mẫu" — no
-- separate visual builder needed. cover_src is optional: a template with none
-- renders live via HandCanvas (TemplatePreviewMedia.tsx) instead of a photo.
-- =========================================================================
create table if not exists public.templates (
  id text primary key,
  name text not null,
  hashtag text not null default '',
  tags text[] not null default '{}',
  skin_tone text not null default 'cozy',
  fingers jsonb not null,
  cover_src text,
  cover_alt text,
  cover_object_position text,
  visible boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Added after the initial release — safe no-op if the columns already exist.
alter table public.templates add column if not exists cover_src text;
alter table public.templates add column if not exists cover_alt text;
alter table public.templates add column if not exists cover_object_position text;
alter table public.templates add column if not exists visible boolean not null default true;

alter table public.templates enable row level security;

-- Hidden templates (admin toggle in /admin/templates) stay fully visible to admins — everyone
-- else only sees visible = true. Distinct from delete: hiding is reversible, keeps the row (and
-- anything referencing its id, e.g. old QR codes/community posts) intact.
drop policy if exists "Templates are viewable by everyone" on public.templates;
create policy "Templates are viewable by everyone"
  on public.templates for select using (
    visible or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins manage templates" on public.templates;
create policy "Admins manage templates"
  on public.templates for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =========================================================================
-- shared_designs — the "recipe & QR" feature in Studio. The QR itself normally embeds the
-- whole design compressed in the URL (works with zero backend), but very detailed designs
-- (lots of stickers/freehand strokes) may not fit in a scannable QR — this table is the
-- durable fallback + what /admin/recipes lists. `id` is the short id already shown in the
-- share link, generated client-side (see src/lib/recipe.ts).
-- =========================================================================
create table if not exists public.shared_designs (
  id text primary key,
  owner_id uuid references public.profiles (id) on delete set null,
  skin_tone text not null check (skin_tone in ('cozy', 'matcha')),
  fingers jsonb not null,
  custom_decals jsonb not null default '[]'::jsonb,
  light jsonb,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.shared_designs enable row level security;

drop policy if exists "Shared designs are viewable by everyone" on public.shared_designs;
create policy "Shared designs are viewable by everyone"
  on public.shared_designs for select using (true);

-- Studio works without logging in, so creating a share/QR must too — a design recipe has
-- no secret data. owner_id may only be null or the caller's own id, never someone else's.
drop policy if exists "Anyone can create a shared design" on public.shared_designs;
create policy "Anyone can create a shared design"
  on public.shared_designs for insert with check (owner_id is null or owner_id = auth.uid());

drop policy if exists "Owners or admins can delete shared designs" on public.shared_designs;
create policy "Owners or admins can delete shared designs"
  on public.shared_designs for delete using (
    (owner_id is not null and auth.uid() = owner_id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create or replace function public.increment_shared_design_views(design_id text)
returns void as $$
begin
  update public.shared_designs set view_count = view_count + 1 where id = design_id;
end;
$$ language plpgsql security definer set search_path = public;

-- =========================================================================
-- site_feedback — the "Góp ý dự án" card on the Về chúng tôi page. Anyone (logged in or not)
-- can drop a note; only admins can read them back, from the dedicated /admin/feedback page.
-- =========================================================================
create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  message text not null,
  -- Admin has "noted"/read this one — set from /admin/feedback, never by the sender.
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

-- Added after the initial release — safe no-op if the column already exists.
alter table public.site_feedback add column if not exists acknowledged boolean not null default false;

alter table public.site_feedback enable row level security;

-- Write-only from the client's point of view: anyone can drop a note, nobody but an admin
-- can read the list back (matches a real contact form's expectations — the sender doesn't
-- get to browse everyone else's messages).
drop policy if exists "Anyone can send feedback" on public.site_feedback;
create policy "Anyone can send feedback"
  on public.site_feedback for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "Admins can read feedback" on public.site_feedback;
create policy "Admins can read feedback"
  on public.site_feedback for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can update feedback" on public.site_feedback;
create policy "Admins can update feedback"
  on public.site_feedback for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete feedback" on public.site_feedback;
create policy "Admins can delete feedback"
  on public.site_feedback for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create or replace function public.rate_limit_site_feedback()
returns trigger as $$
begin
  perform public.enforce_rate_limit('site_feedback', 5, interval '10 minutes');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists rate_limit_site_feedback_trigger on public.site_feedback;
create trigger rate_limit_site_feedback_trigger
  before insert on public.site_feedback
  for each row execute procedure public.rate_limit_site_feedback();

-- =========================================================================
-- saved_designs — Studio's "Lưu/Mở" personal collection, one row per save. Distinct from
-- shared_designs above: that one is an anonymous-ok, auto-named, ephemeral QR export; this one
-- is a named, permanent, account-owned save — requires login (no owner to attach it to
-- otherwise), and is what the "Bộ sưu tập" section on a user's profile page reads.
-- =========================================================================
create table if not exists public.saved_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Thiết kế chưa đặt tên',
  skin_tone text not null check (skin_tone in ('cozy', 'matcha')),
  fingers jsonb not null,
  custom_decals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists saved_designs_user_id_idx on public.saved_designs (user_id, created_at desc);

alter table public.saved_designs enable row level security;

-- Public read (shown on the owner's public profile page, like a portfolio) — same "Bộ sưu tập
-- is public" call as community posts. Write access is owner-only.
drop policy if exists "Saved designs are viewable by everyone" on public.saved_designs;
create policy "Saved designs are viewable by everyone"
  on public.saved_designs for select using (true);

drop policy if exists "Users can save their own designs" on public.saved_designs;
create policy "Users can save their own designs"
  on public.saved_designs for insert with check (auth.uid() = user_id);

drop policy if exists "Owners or admins can delete saved designs" on public.saved_designs;
create policy "Owners or admins can delete saved designs"
  on public.saved_designs for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =========================================================================
-- rate_limit_hits — generic per-user/per-action counter used by the triggers below to throttle
-- spammy writes (post/like/QR-save flooding). Never touched directly from the client: only the
-- security-definer trigger functions read/write it, and RLS below denies all direct access.
-- =========================================================================
create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup on public.rate_limit_hits (user_id, action, created_at);

alter table public.rate_limit_hits enable row level security;
-- No policies at all -> every direct client request is denied; only security-definer functions
-- (which bypass RLS) may read/write this table.

create or replace function public.enforce_rate_limit(p_action text, p_max_count int, p_window interval)
returns void as $$
declare
  hit_count int;
begin
  if auth.uid() is null then
    return; -- nothing to key a per-user limit on; anonymous writes are already restricted by RLS elsewhere
  end if;
  delete from public.rate_limit_hits where created_at < now() - p_window;
  select count(*) into hit_count
  from public.rate_limit_hits
  where user_id = auth.uid() and action = p_action and created_at > now() - p_window;
  if hit_count >= p_max_count then
    raise exception 'RATE_LIMITED: Bạn đang thao tác quá nhanh, vui lòng thử lại sau ít phút.';
  end if;
  insert into public.rate_limit_hits (user_id, action) values (auth.uid(), p_action);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.rate_limit_community_posts()
returns trigger as $$
begin
  perform public.enforce_rate_limit('community_post', 5, interval '10 minutes');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists rate_limit_community_posts_trigger on public.community_posts;
create trigger rate_limit_community_posts_trigger
  before insert on public.community_posts
  for each row execute procedure public.rate_limit_community_posts();

create or replace function public.rate_limit_community_likes()
returns trigger as $$
begin
  perform public.enforce_rate_limit('community_like', 40, interval '1 minute');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists rate_limit_community_likes_trigger on public.community_likes;
create trigger rate_limit_community_likes_trigger
  before insert on public.community_likes
  for each row execute procedure public.rate_limit_community_likes();

create or replace function public.rate_limit_community_comments()
returns trigger as $$
begin
  perform public.enforce_rate_limit('community_comment', 20, interval '10 minutes');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists rate_limit_community_comments_trigger on public.community_comments;
create trigger rate_limit_community_comments_trigger
  before insert on public.community_comments
  for each row execute procedure public.rate_limit_community_comments();

create or replace function public.rate_limit_shared_designs()
returns trigger as $$
begin
  perform public.enforce_rate_limit('shared_design', 20, interval '1 hour');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists rate_limit_shared_designs_trigger on public.shared_designs;
create trigger rate_limit_shared_designs_trigger
  before insert on public.shared_designs
  for each row execute procedure public.rate_limit_shared_designs();

create or replace function public.rate_limit_saved_designs()
returns trigger as $$
begin
  perform public.enforce_rate_limit('saved_design', 30, interval '1 hour');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists rate_limit_saved_designs_trigger on public.saved_designs;
create trigger rate_limit_saved_designs_trigger
  before insert on public.saved_designs
  for each row execute procedure public.rate_limit_saved_designs();

-- =========================================================================
-- site_settings — single-row table of admin-controlled site-wide toggles, read by every visitor
-- (to show a maintenance banner or close registration) and writable only by admins.
-- =========================================================================
create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  registration_open boolean not null default true,
  maintenance_mode boolean not null default false,
  maintenance_message text not null default 'VIBEU đang bảo trì, quay lại sau ít phút nhé!',
  require_captcha boolean not null default false,
  -- On (default): new community posts start hidden (community_posts.approved = false) until an
  -- admin approves them — see /admin/community. Off: posts insert already approved, so they go
  -- public immediately (still rate-limited) — see createCommunityPost's `approved` argument.
  community_moderation boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

-- Added after the initial release — safe no-op if the column already exists.
alter table public.site_settings add column if not exists community_moderation boolean not null default true;

alter table public.site_settings enable row level security;

drop policy if exists "Site settings are viewable by everyone" on public.site_settings;
create policy "Site settings are viewable by everyone"
  on public.site_settings for select using (true);

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =========================================================================
-- Storage bucket for user-uploaded community photos.
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', true, 8388608, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

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
-- Storage bucket for blog cover images — admin-only, since blog_posts itself is.
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-covers', 'blog-covers', true, 8388608, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read blog covers" on storage.objects;
create policy "Public read blog covers"
  on storage.objects for select using (bucket_id = 'blog-covers');

drop policy if exists "Admins can upload blog covers" on storage.objects;
create policy "Admins can upload blog covers"
  on storage.objects for insert with check (
    bucket_id = 'blog-covers' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete blog covers" on storage.objects;
create policy "Admins can delete blog covers"
  on storage.objects for delete using (
    bucket_id = 'blog-covers' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =========================================================================
-- Storage bucket for template cover photos — admin-only, since templates itself is.
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('template-covers', 'template-covers', true, 8388608, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read template covers" on storage.objects;
create policy "Public read template covers"
  on storage.objects for select using (bucket_id = 'template-covers');

drop policy if exists "Admins can upload template covers" on storage.objects;
create policy "Admins can upload template covers"
  on storage.objects for insert with check (
    bucket_id = 'template-covers' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete template covers" on storage.objects;
create policy "Admins can delete template covers"
  on storage.objects for delete using (
    bucket_id = 'template-covers' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =========================================================================
-- Storage bucket for profile avatars.
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "Users can replace their own avatar" on storage.objects;
create policy "Users can replace their own avatar"
  on storage.objects for update using (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete using (bucket_id = 'avatars' and owner = auth.uid());

-- =========================================================================
-- After running this file: promote your own account to admin so /admin
-- unlocks. Replace the email, then run separately:
-- =========================================================================
-- update public.profiles set role = 'admin' where email = 'your-account@example.com';
