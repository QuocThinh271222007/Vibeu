-- The blog admin editor moved from a discrete-block UI (paragraph/heading2/heading3/image
-- blocks, each its own textarea) to a real WYSIWYG editor (continuous text, like Word) that
-- also supports inserting Excel-like tables. This column holds that editor's sanitized HTML
-- output. BlogPost.tsx renders content_html when non-empty, falling back to the existing
-- content_blocks/content for posts that haven't been opened and re-saved in the new editor yet
-- — nothing needs to be migrated up front, existing posts keep rendering exactly as before
-- until an admin edits and saves them. Idempotent: safe to re-run.
alter table public.blog_posts add column if not exists content_html text not null default '';
