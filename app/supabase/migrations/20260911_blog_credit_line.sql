-- Makes the blog post's closing credit line ("Bài viết và hình ảnh được thực hiện bởi
-- VIBEU") an editable per-post field instead of a hardcoded string in BlogPost.tsx.
-- Adding the column with a default backfills every existing row with that same text —
-- no separate backfill needed. Idempotent: safe to re-run.
alter table public.blog_posts add column if not exists credit_line text not null default 'Bài viết và hình ảnh được thực hiện bởi VIBEU';
