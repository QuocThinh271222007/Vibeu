import { supabase } from '@/lib/supabaseClient'

export interface SiteSettings {
  registrationOpen: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
  requireCaptcha: boolean
}

const DEFAULTS: SiteSettings = {
  registrationOpen: true,
  maintenanceMode: false,
  maintenanceMessage: 'VIBEU đang bảo trì, quay lại sau ít phút nhé!',
  requireCaptcha: false,
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
  }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.registrationOpen !== undefined) row.registration_open = patch.registrationOpen
  if (patch.maintenanceMode !== undefined) row.maintenance_mode = patch.maintenanceMode
  if (patch.maintenanceMessage !== undefined) row.maintenance_message = patch.maintenanceMessage
  if (patch.requireCaptcha !== undefined) row.require_captcha = patch.requireCaptcha
  const { error } = await supabase.from('site_settings').update(row).eq('id', true)
  return { error: error?.message ?? null }
}
