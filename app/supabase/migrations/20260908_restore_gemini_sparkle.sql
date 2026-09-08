-- An admin accidentally deleted the 'gemini-sparkle' template row from /admin/templates.
-- It's one of Hero.tsx's SHOWCASE_META entries (the 3 floating cards on the landing page),
-- so its disappearance broke that card there too.
--
-- Restored from two surviving sources: the original insert in
-- 20260906_seed_static_content.sql (name/hashtag/tags/skin_tone/cover_*) and the
-- 'gemini-sparkle-recipe' row created by 20260907_template_photo_split.sql (which copied
-- 'fingers' from this row before it was deleted, so the exact design is still intact there).
-- Safe to re-run: `on conflict (id) do nothing`.
insert into public.templates (id, name, hashtag, tags, skin_tone, fingers, cover_src, cover_alt, cover_object_position, visible, created_by, created_at)
values (
  'gemini-sparkle',
  'Gemini Sparkle',
  '#SongTử #CatEye #Lavender',
  array['zodiac', 'tone'],
  'cozy',
  '{"thumb":{"presetId":"lavender-dream","effect":"catEye","shape":"almond"},"index":{"presetId":"lavender-dream","effect":"catEye","shape":"almond"},"middle":{"presetId":"lavender-dream","effect":"catEye","shape":"almond"},"ring":{"presetId":"opal-pearl","effect":"catEye","shape":"almond","stickers":[{"instanceId":"tmp","uv":[0.5,0.42],"scale":1,"rotation":0,"z":0,"stickerId":"star-8-sparkle"}]},"little":{"presetId":"lavender-dream","effect":"catEye","shape":"almond"}}'::jsonb,
  '/assets/templates/gemini-sparkle/cover.jpg',
  'Móng tay hồng pastel đính nơ ngọc trai và trái tim lãng mạn',
  'center center',
  true,
  null,
  now()
)
on conflict (id) do nothing;
