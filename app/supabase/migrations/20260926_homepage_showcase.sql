-- Ordered template ids for the 3 floating showcase cards on the homepage Hero — see
-- src/components/home/Hero.tsx and src/pages/admin/AdminSettings.tsx.
-- Empty array (default) = Hero.tsx falls back to its hardcoded starter picks.
alter table public.site_settings add column if not exists homepage_showcase_template_ids jsonb not null default '[]'::jsonb;
