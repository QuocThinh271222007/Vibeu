-- One-time split: the 21 original templates each currently do double duty as both a real
-- AI-photo showcase (locked in Studio — see templateLock.ts, which treats "has a cover_src" as
-- locked) AND the editable recipe that produced that photo. This duplicates each into a second,
-- purely-recipe row with no cover photo — templateLock.ts needs no code change, since a row with
-- cover_src = null already renders live (HandCanvas) and is NOT locked, exactly like any
-- admin-created template. The original 21 ids are untouched (still locked, still the AI photo,
-- still whatever external links/QRs/community posts already reference them) — this only adds
-- 21 new rows, going from 21 -> 42 templates.
-- Safe to re-run: `on conflict (id) do nothing`.
insert into public.templates (id, name, hashtag, tags, skin_tone, fingers, cover_src, cover_alt, cover_object_position, visible, created_by, created_at)
select
  id || '-recipe',
  name || ' (Công thức)',
  hashtag,
  tags,
  skin_tone,
  fingers,
  null, null, null,
  true,
  created_by,
  now()
from public.templates
where id in (
  'aquarius-aurora', 'aries-cherry-flame', 'cancer-moon-milk', 'capricorn-chrome', 'dong-winter-frost',
  'gemini-sparkle', 'ha-ocean-breeze', 'leo-golden-glow', 'libra-rose-quartz', 'minimalist-nude',
  'pisces-ocean-dream', 'sagittarius-sunset', 'scorpio-midnight', 'strawberry-lace-dream', 'taurus-matcha-latte',
  'thu-terracotta-leaves', 'tone-pastel-rainbow', 'virgo-sage-minimal', 'xuan-cherry-blossom', 'y2k-butterfly-chrome',
  'y2k-candy-pop'
)
on conflict (id) do nothing;
