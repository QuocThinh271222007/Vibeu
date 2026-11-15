-- Admin-chosen "Bài viết liên quan" per blog post: an ordered list of blog_posts ids shown in the
-- post page's sidebar. Empty (the default) keeps the automatic behaviour — same-category posts
-- first, then others. No foreign key on purpose: a deleted/unpublished post is simply skipped at
-- render time instead of needing cascade bookkeeping. Idempotent: safe to re-run.
alter table public.blog_posts add column if not exists related_post_ids uuid[] not null default '{}';
