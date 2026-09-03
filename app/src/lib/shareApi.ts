import type { SharedDesignPayload } from '@/lib/designCodec'
import { supabase } from '@/lib/supabaseClient'
import type { FingerId, SkinToneId } from '@/types/vibeu'

interface SharedDesignRow {
  id: string
  owner_id: string | null
  skin_tone: SkinToneId
  fingers: Record<FingerId, unknown>
  custom_decals: unknown[]
  light: { exposure: number; strength: number; angleDeg: number } | null
  view_count: number
  created_at: string
}

function rowToPayload(row: SharedDesignRow): SharedDesignPayload {
  return {
    skinTone: row.skin_tone,
    fingers: row.fingers as SharedDesignPayload['fingers'],
    customDecals: row.custom_decals as SharedDesignPayload['customDecals'],
    light: row.light ?? undefined,
  }
}

/** Persists a design server-side under `id` — the durable fallback for when the design is too
 * large to fit compressed inside the QR code itself (see ResultView's SIZE budget). Retries
 * once with a fresh id on the (extremely unlikely) chance of a collision. */
export async function saveSharedDesign(
  id: string,
  payload: SharedDesignPayload,
  ownerId: string | null,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('shared_designs').insert({
    id,
    owner_id: ownerId,
    skin_tone: payload.skinTone,
    fingers: payload.fingers,
    custom_decals: payload.customDecals,
    light: payload.light ?? null,
  })
  return { error: error?.message ?? null }
}

export async function fetchSharedDesign(id: string): Promise<SharedDesignPayload | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('shared_designs').select('*').eq('id', id).single()
  if (error || !data) return null
  void supabase.rpc('increment_shared_design_views', { design_id: id })
  return rowToPayload(data as SharedDesignRow)
}

export interface SharedDesignAdminRow {
  id: string
  skinTone: SkinToneId
  ownerName: string | null
  viewCount: number
  createdAt: string
}

export async function fetchAllSharedDesignsAdmin(): Promise<SharedDesignAdminRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('shared_designs')
    .select('id, skin_tone, view_count, created_at, profiles(display_name)')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as unknown as (SharedDesignRow & { profiles: { display_name: string } | null })[]).map((row) => ({
    id: row.id,
    skinTone: row.skin_tone,
    ownerName: row.profiles?.display_name ?? null,
    viewCount: row.view_count,
    createdAt: row.created_at,
  }))
}

export async function deleteSharedDesign(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('shared_designs').delete().eq('id', id)
  return { error: error?.message ?? null }
}
