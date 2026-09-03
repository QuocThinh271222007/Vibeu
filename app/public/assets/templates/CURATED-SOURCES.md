# Curated preview photography sources

These photographs are used only as editorial/marketing preview media in Home and Library.
They are not used as the editable Studio rendering source.

**Update (2026-09-03, second pass):** replaced the entire 20-image Pinterest-sourced set
below with 20 AI-generated (ChatGPT Image) photos supplied directly by the user, who found
the Pinterest set "too ugly and worthless" (quá xấu và ko có giá trị). Each supplied photo
was assigned to the template whose color palette/mood it fits best (exact zodiac-symbol
matching was not attempted — these are decorative cover photos, not literal renders of the
template's design, consistent with how the Pinterest set worked before). Since these are
AI-generated images provided by the user (not scraped), the earlier Pinterest copyright-risk
caveat no longer applies to this set. Original files (named
`ChatGPT Image <time> 3 thg 9, 2026 (<n>).png`) were dropped by the user at the repo root
and are not tracked in git; each was resized to a 1400px-max-dimension JPEG (quality 88) via
Pillow into its template's `cover.jpg`. See the filename-to-template mapping in
`app/src/data/curatedPreviews.ts`'s history (or the conversion script used at the time) if
the originals are ever needed again.

- `strawberry-lace-dream` — user-provided reference/cover supplied directly by the user for
  this VIBEU prototype, from an earlier round. **Not replaced** — left as-is.
- All other 20 templates now use one of the 20 newly user-supplied ChatGPT Image photos
  each (tea-party pastels, ombre bows, cherry blossom, mermaid/ocean shells, coffee-tone
  line art, winter snowflake glitter, matcha tea charms, celestial night sky, gothic
  wine/rose-gold romantic sets, strawberry-cream sweets, and pastel florals).

The previous Pinterest sourcing (kept here for history only, superseded above): 12 zodiac
covers were cropped from one Pinterest collage
(pinterest.com/ideas/zodiac-sign-nail-designs/940449341398/); the seasonal/Y2K/minimalist
covers came from individual Pinterest idea pins. That set carried an unverified-license
caveat that no longer applies now that the covers are user-supplied AI-generated images.

The application keeps a live `HandCanvas` fallback when curated media is unavailable.
