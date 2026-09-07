import { supabase } from '@/lib/supabaseClient'
import { friendlyDbError } from '@/lib/communityApi'

/** Backs the "Góp ý dự án" card on the Về chúng tôi page — works whether the sender is
 * logged in or not (site_feedback's RLS allows anonymous inserts, same as shared_designs). */
export async function submitFeedback(name: string, message: string, userId: string | null): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('site_feedback').insert({ name, message, user_id: userId })
  return { error: error ? friendlyDbError(error.message) : null }
}
