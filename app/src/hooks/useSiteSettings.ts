import { useEffect, useState } from 'react'
import { fetchSiteSettings, type SiteSettings } from '@/lib/siteSettingsApi'

/** null while loading — callers should treat that as "assume open/no maintenance" rather than
 * blocking the page, since a Supabase round-trip should never gate the first paint. */
export function useSiteSettings(): SiteSettings | null {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  useEffect(() => {
    let alive = true
    fetchSiteSettings().then((s) => {
      if (alive) setSettings(s)
    })
    return () => {
      alive = false
    }
  }, [])
  return settings
}
