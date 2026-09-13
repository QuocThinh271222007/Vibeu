-- Adds a per-post "show table of contents" toggle. The TOC itself is always auto-generated
-- from the post's own heading2/heading3 content_blocks (BlogPost.tsx) — this column only lets
-- an editor opt a specific post out (e.g. a short post with a single heading doesn't need one).
-- Adding the column with a default backfills every existing row to true. Idempotent.
alter table public.blog_posts add column if not exists show_toc boolean not null default true;
