import { useEffect, useState } from 'react'
import { fetchSiteSettings, type SiteSettings } from '@/lib/siteSettingsApi'

// Shared module-wide cache — every route mounts App.tsx (which reads this for the maintenance-mode
// check) and Home additionally mounts Hero.tsx (which reads it for the admin's homepage showcase
// picks), and each had its own independent useEffect firing its own fetch for the exact same
// single-row table. Deduping into one in-flight promise (same pattern as data/templates.ts) cut a
// real, measured duplicate request off every homepage load (2026-09-30 perf pass).
let settingsPromise: Promise<SiteSettings | null> | null = null
function loadSiteSettings(): Promise<SiteSettings | null> {
  if (!settingsPromise) settingsPromise = fetchSiteSettings()
  return settingsPromise
}

/** Drops the cache and refetches — call after an admin saves changes in /admin/settings so
 * other already-open tabs/components pick up the new values without a full reload. */
export function invalidateSiteSettings(): Promise<SiteSettings | null> {
  settingsPromise = null
  return loadSiteSettings()
}

/** null while loading — callers should treat that as "assume open/no maintenance" rather than
 * blocking the page, since a Supabase round-trip should never gate the first paint. */
export function useSiteSettings(): SiteSettings | null {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  useEffect(() => {
    let alive = true
    loadSiteSettings().then((s) => {
      if (alive) setSettings(s)
    })
    return () => {
      alive = false
    }
  }, [])
  return settings
}
