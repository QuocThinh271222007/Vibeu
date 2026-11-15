import type { DecalAsset, DecalLayerType } from '@/types/vibeu'
import { DECAL_ASSETS_BUCKET, supabase } from '@/lib/supabaseClient'

const ALLOWED_DECAL_TYPES = ['image/svg+xml', 'image/png', 'image/webp', 'image/gif']
const MAX_DECAL_BYTES = 4 * 1024 * 1024

export interface DecalRow {
  id: string
  name: string
  name_vi: string
  category: string
  category_vi: string
  tags: string[]
  path: string
  thumbnail: string | null
  view_box_w: number
  view_box_h: number
  content_bounds: [number, number, number, number]
  default_scale: number
  tintable: boolean
  layer_type: DecalLayerType
  style: string | null
  source: string
  license: string
  tier: 'standard' | 'premium'
  created_by: string | null
  created_at: string
  updated_at: string
}

export function mapRowToDecal(row: DecalRow): DecalAsset {
  return {
    id: row.id,
    name: row.name,
    nameVi: row.name_vi,
    category: row.category,
    categoryVi: row.category_vi,
    tags: row.tags,
    path: row.path,
    thumbnail: row.thumbnail ?? undefined,
    viewBox: [row.view_box_w, row.view_box_h],
    contentBounds: row.content_bounds,
    defaultScale: row.default_scale,
    tintable: row.tintable,
    layerType: row.layer_type,
    style: row.style ?? undefined,
    source: row.source,
    license: row.license,
    tier: row.tier,
  }
}

/** Public read — every decal (migrated built-ins + anything added from /admin/decals), for the
 * Charm library picker (Studio) and the Admin list alike. */
export async function fetchAllDecals(): Promise<DecalAsset[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('decals').select('*').order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as DecalRow[]).map(mapRowToDecal)
}

/** Just the row count — for a marketing "N decal nail art" stat (Hero.tsx) that has no business
 * downloading all ~520 rows' full SVG paths/tags/etc. just to read `.length`. `head: true` makes
 * PostgREST return the count in a response header with an empty body, not the rows themselves. */
export async function fetchDecalsCount(): Promise<number> {
  if (!supabase) return 0
  const { count, error } = await supabase.from('decals').select('*', { count: 'exact', head: true })
  if (error || count === null) return 0
  return count
}

/** Same rows as fetchAllDecals, kept as raw DecalRow so /admin/decals can edit fields directly. */
export async function fetchAllDecalsAdmin(): Promise<DecalRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('decals').select('*').order('created_at', { ascending: true })
  if (error || !data) return []
  return data as DecalRow[]
}

export interface DecalInput {
  id: string
  name: string
  nameVi: string
  category: string
  categoryVi: string
  tags: string[]
  path: string
  thumbnail: string | null
  viewBoxW: number
  viewBoxH: number
  contentBounds: [number, number, number, number]
  defaultScale: number
  tintable: boolean
  layerType: DecalLayerType
  style: string | null
  source: string
  license: string
  tier: 'standard' | 'premium'
}

export async function createDecal(input: DecalInput, createdBy: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('decals').insert({
    id: input.id,
    name: input.name,
    name_vi: input.nameVi,
    category: input.category,
    category_vi: input.categoryVi,
    tags: input.tags,
    path: input.path,
    thumbnail: input.thumbnail,
    view_box_w: input.viewBoxW,
    view_box_h: input.viewBoxH,
    content_bounds: input.contentBounds,
    default_scale: input.defaultScale,
    tintable: input.tintable,
    layer_type: input.layerType,
    style: input.style,
    source: input.source,
    license: input.license,
    tier: input.tier,
    created_by: createdBy,
  })
  return { error: error?.message ?? null }
}

export async function updateDecal(id: string, input: DecalInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase
    .from('decals')
    .update({
      name: input.name,
      name_vi: input.nameVi,
      category: input.category,
      category_vi: input.categoryVi,
      tags: input.tags,
      path: input.path,
      thumbnail: input.thumbnail,
      view_box_w: input.viewBoxW,
      view_box_h: input.viewBoxH,
      content_bounds: input.contentBounds,
      default_scale: input.defaultScale,
      tintable: input.tintable,
      layer_type: input.layerType,
      style: input.style,
      source: input.source,
      license: input.license,
      tier: input.tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteDecal(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('decals').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export async function decalIdExists(id: string): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.from('decals').select('id').eq('id', id).maybeSingle()
  return Boolean(data)
}

export async function uploadDecalAsset(file: File, adminId: string): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Chưa kết nối Supabase.' }
  if (!ALLOWED_DECAL_TYPES.includes(file.type)) {
    return { url: null, error: 'Chỉ nhận ảnh SVG, PNG, WebP hoặc GIF.' }
  }
  if (file.size > MAX_DECAL_BYTES) {
    return { url: null, error: 'Ảnh vượt quá 4MB, hãy chọn ảnh nhẹ hơn.' }
  }
  const ext = file.name.split('.').pop() || 'svg'
  const path = `${adminId}/${Date.now()}.${ext}`
  // Long cache: paths here are never overwritten (upsert: false, unique per upload), so there's
  // no staleness risk — this just stops Supabase re-serving the exact same bytes on every repeat
  // view (was defaulting to 1h, a real contributor to hitting the free-tier egress quota).
  const { error } = await supabase.storage.from(DECAL_ASSETS_BUCKET).upload(path, file, { upsert: false, cacheControl: '31536000' })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from(DECAL_ASSETS_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
