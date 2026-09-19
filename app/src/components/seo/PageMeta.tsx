const SITE_URL = 'https://vibeu.design'
const SITE_NAME = 'VIBEU'

/**
 * Per-page <title>/<meta>/<link> tags. React 19 auto-hoists title/meta/link elements rendered
 * anywhere in the tree into the real document <head> — no react-helmet or provider needed, and
 * nothing here renders any visible UI. Drop one of these near the top of each page component;
 * the tags update automatically on route change since React reconciles/replaces them.
 */
export function PageMeta({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
  noindex = false,
}: {
  /** Page-specific title — SITE_NAME is appended automatically, don't repeat it here. */
  title: string
  description: string
  /** Path only, e.g. "/blog/ten-bai-viet" — SITE_URL is prefixed automatically. */
  canonicalPath: string
  image?: string
  type?: 'website' | 'article'
  /** Utility/private pages (login, admin, 404, settings) — kept crawlable (robots.txt still
   * allows fetching them) but excluded from the index. Meta robots controls indexing; robots.txt
   * controls crawling — the two aren't interchangeable, so this exists as its own prop rather
   * than being folded into a Disallow rule. */
  noindex?: boolean
}) {
  const url = `${SITE_URL}${canonicalPath}`
  const fullTitle = `${title} — ${SITE_NAME}`
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex,follow' : 'index,follow'} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  )
}
