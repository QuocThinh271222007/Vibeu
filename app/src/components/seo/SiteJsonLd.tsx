const SITE_URL = 'https://vibeu.design'

/**
 * Sitewide Organization + WebSite structured data — rendered once, on the homepage only (Google
 * associates this with the domain regardless of which page it's declared on; duplicating it on
 * every page would just be redundant). Deliberately does NOT include a SearchAction: that schema
 * powered Google's sitelinks search box, which Google discontinued — including it today would be
 * dead weight, not a sitelinks lever. Every field below is real (matches Footer.tsx's actual
 * social links and the real favicon asset) — no placeholder/fabricated data.
 */
export function SiteJsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VIBEU',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/brand/logo-mark.png`,
    sameAs: [
      'https://www.facebook.com/profile.php?id=61593919006915',
      'https://www.instagram.com/vibe_u_art',
      'https://www.threads.com/@vibe_u_art',
    ],
  }
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'VIBEU',
    url: SITE_URL,
  }
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(organization)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </>
  )
}
