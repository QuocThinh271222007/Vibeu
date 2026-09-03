# Curated preview photography sources

These photographs are used only as editorial/marketing preview media in Home and Library.
They are not used as the editable Studio rendering source.

**Update (2026-09-03):** replaced the previous Wikimedia Commons set (3 templates only) with
one curated cover per template (20 of 21) per explicit user request/instruction, after being
told this carries real copyright risk for a commercial product and choosing to accept that
risk anyway. **These images do NOT have a verified reuse license** — unlike the earlier
Wikimedia Commons set (CC BY / CC BY-SA, still the discipline used for blog covers before
this change — see app/public/assets/blog/SOURCES.md for that same 2026-09-03 change there
too), they were pulled directly from Pinterest pins (`i.pinimg.com` CDN) rendered through
this session's own CDP browser automation (a plain HTTP fetch only returns Pinterest's
client-side app shell with no image URLs — JS execution is required to see them). If this
decision changes, revert to properly-licensed sources rather than mixing licensing regimes
silently.

- `strawberry-lace-dream` — user-provided reference/cover supplied directly by the user for
  this VIBEU prototype. **Not replaced** — left as-is.
- 12 zodiac templates (`gemini-sparkle`, `leo-golden-glow`, `pisces-ocean-dream`,
  `cancer-moon-milk`, `aries-cherry-flame`, `virgo-sage-minimal`, `scorpio-midnight`,
  `sagittarius-sunset`, `capricorn-chrome`, `aquarius-aurora`, `taurus-matcha-latte`,
  `libra-rose-quartz`) — all 12 cropped from ONE Pinterest collage image (real nail art
  photographed per zodiac sign, with sign name overlays), found via
  pinterest.com/ideas/zodiac-sign-nail-designs/940449341398/.
- `xuan-cherry-blossom` — French tip with hand-painted cherry blossom branch, via
  pinterest.com/ideas/cherry-blossom-nails/934895467520/.
- `ha-ocean-breeze` — blue marble French tip with gold shell charms, via
  pinterest.com/ideas/ocean-blue-nail-designs/920844174067/.
- `thu-terracotta-leaves` — cropped from a "Terracotta Nails" infographic's hand photo
  (text/infographic elements cropped out), via
  pinterest.com/ideas/terracotta-nail-designs/928847415629/.
- `dong-winter-frost` — nude base with white snowflake nail art and silver glitter, via
  pinterest.com/ideas/silver-and-white-winter-nails/922596567203/.
- `y2k-butterfly-chrome` — chrome butterfly-wing nail art, via
  pinterest.com/ideas/butterfly-chrome-nails/908091076742/.
- `y2k-candy-pop` — colorful abstract Y2K nail art, via pinterest.com/ideas/nail-candy/943309604484/.
- `minimalist-nude` — clean short nude nails, via
  pinterest.com/ideas/minimalist-natural-nails/958723599008/.
- `tone-pastel-rainbow` — pastel rainbow striped/arc nail art, via
  pinterest.com/ideas/pastel-rainbow-nail-art/913563709462/.

All downloaded at the pin's `originals` CDN resolution where available, downscaled to a
1200-1400px-max-dimension JPEG (quality 88) for web delivery.

The application keeps a live `HandCanvas` fallback when curated media is unavailable.
