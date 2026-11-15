import { supabase } from '@/lib/supabaseClient'

export interface SiteSettings {
  registrationOpen: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
  requireCaptcha: boolean
  /** true (default) = new community posts need admin approval before going public. false =
   * posts go public immediately on creation (still rate-limited). */
  communityModeration: boolean
  /** Ordered template ids for the homepage Hero's 3 floating showcase cards — empty (default)
   * means Hero.tsx falls back to its own hardcoded starter picks. Never trust these blindly: a
   * listed id may have since been deleted/hidden, so Hero.tsx re-validates against the live
   * template list and backfills any gap from the rest of the library. */
  homepageShowcaseTemplateIds: string[]
}

const DEFAULTS: SiteSettings = {
  registrationOpen: true,
  maintenanceMode: false,
  maintenanceMessage: 'VIBEU đang bảo trì, quay lại sau ít phút nhé!',
  requireCaptcha: false,
  communityModeration: true,
  homepageShowcaseTemplateIds: [],
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return DEFAULTS
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', true).single()
  if (error || !data) return DEFAULTS
  return {
    registrationOpen: data.registration_open,
    maintenanceMode: data.maintenance_mode,
    maintenanceMessage: data.maintenance_message,
    requireCaptcha: data.require_captcha,
    communityModeration: data.community_moderation ?? true,
    homepageShowcaseTemplateIds: Array.isArray(data.homepage_showcase_template_ids) ? data.homepage_showcase_template_ids : [],
  }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.registrationOpen !== undefined) row.registration_open = patch.registrationOpen
  if (patch.maintenanceMode !== undefined) row.maintenance_mode = patch.maintenanceMode
  if (patch.maintenanceMessage !== undefined) row.maintenance_message = patch.maintenanceMessage
  if (patch.requireCaptcha !== undefined) row.require_captcha = patch.requireCaptcha
  if (patch.communityModeration !== undefined) row.community_moderation = patch.communityModeration
  if (patch.homepageShowcaseTemplateIds !== undefined) row.homepage_showcase_template_ids = patch.homepageShowcaseTemplateIds
  const { error } = await supabase.from('site_settings').update(row).eq('id', true)
  return { error: error?.message ?? null }
}
