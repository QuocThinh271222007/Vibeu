import { supabase } from '@/lib/supabaseClient'
import { friendlyDbError } from '@/lib/communityApi'

/** Backs the "Góp ý dự án" card on the Về chúng tôi page — works whether the sender is
 * logged in or not (site_feedback's RLS allows anonymous inserts, same as shared_designs). */
export async function submitFeedback(name: string, message: string, userId: string | null): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('site_feedback').insert({ name, message, user_id: userId })
  return { error: error ? friendlyDbError(error.message) : null }
}

export interface SiteFeedback {
  id: string
  userId: string | null
  name: string
  message: string
  acknowledged: boolean
  createdAt: string
}

interface SiteFeedbackRow {
  id: string
  user_id: string | null
  name: string
  message: string
  acknowledged: boolean
  created_at: string
}

function mapRow(row: SiteFeedbackRow): SiteFeedback {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    message: row.message,
    acknowledged: row.acknowledged,
    createdAt: row.created_at,
  }
}

/** Admin-only (RLS restricts select to admins) — backs /admin/feedback. */
export async function fetchFeedbackAdmin(): Promise<SiteFeedback[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('site_feedback').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as unknown as SiteFeedbackRow[]).map(mapRow)
}

export async function setFeedbackAcknowledged(id: string, acknowledged: boolean): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('site_feedback').update({ acknowledged }).eq('id', id)
  return { error: error ? friendlyDbError(error.message) : null }
}

export async function deleteFeedback(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('site_feedback').delete().eq('id', id)
  return { error: error?.message ?? null }
}
