import { supabase } from '@/lib/supabaseClient'
import type { DecalAsset, FingerDesign, FingerId, SkinToneId } from '@/types/vibeu'

export interface SavedDesignRow {
  id: string
  userId: string
  name: string
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  customDecals: DecalAsset[]
  createdAt: string
}

interface SavedDesignDbRow {
  id: string
  user_id: string
  name: string
  skin_tone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  custom_decals: DecalAsset[]
  created_at: string
}

function mapRow(row: SavedDesignDbRow): SavedDesignRow {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    skinTone: row.skin_tone,
    fingers: row.fingers,
    customDecals: row.custom_decals ?? [],
    createdAt: row.created_at,
  }
}

/** A user's own "Lưu/Mở" collection, newest first — used by both the Studio Save panel and
 * the "Bộ sưu tập" section on that user's public profile page. */
export async function fetchSavedDesigns(userId: string): Promise<SavedDesignRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('saved_designs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as SavedDesignDbRow[]).map(mapRow)
}

export async function fetchSavedDesign(id: string): Promise<SavedDesignRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('saved_designs').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return mapRow(data as SavedDesignDbRow)
}

export async function createSavedDesign(
  userId: string,
  name: string,
  skinTone: SkinToneId,
  fingers: Record<FingerId, FingerDesign>,
  customDecals: DecalAsset[],
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('saved_designs').insert({
    user_id: userId,
    name: name.trim() || 'Thiết kế chưa đặt tên',
    skin_tone: skinTone,
    fingers,
    custom_decals: customDecals,
  })
  return { error: error?.message ?? null }
}

export async function deleteSavedDesign(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('saved_designs').delete().eq('id', id)
  return { error: error?.message ?? null }
}
