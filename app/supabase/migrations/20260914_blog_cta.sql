-- Per-post call-to-action banner rendered after the post's own content on the blog detail
-- page (BlogPost.tsx) — editable per post so a Studio-focused post can point at /studio while
-- another points at /library or /community. Adding columns with defaults backfills every
-- existing row with the same VIBEU/Studio CTA. Idempotent: safe to re-run.
alter table public.blog_posts add column if not exists cta_enabled boolean not null default true;
alter table public.blog_posts add column if not exists cta_title text not null default 'Thử ngay ý tưởng này trên Nail Studio';
alter table public.blog_posts add column if not exists cta_button_label text not null default 'Bắt đầu thiết kế miễn phí';
alter table public.blog_posts add column if not exists cta_button_url text not null default '/studio';
