-- The blog post sidebar's "VIBEU trên Facebook" card switched from embedding the whole Facebook
-- Page (Page Plugin — proved unreliable: adaptive-resize/lazy-load edge cases left it stuck on a
-- loading spinner) to embedding one specific Facebook post per blog post, set from the admin
-- editor. Null hides the card. Idempotent: safe to re-run.
alter table public.blog_posts add column if not exists facebook_post_url text;
