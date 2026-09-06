import type { FingerDesign, FingerId, SkinToneId, Template } from '@/types/vibeu'
import { supabase, TEMPLATE_COVERS_BUCKET } from '@/lib/supabaseClient'

const ALLOWED_COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_COVER_BYTES = 8 * 1024 * 1024

export interface TemplateRow {
  id: string
  name: string
  hashtag: string
  tags: string[]
  skin_tone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  cover_src: string | null
  cover_alt: string | null
  cover_object_position: string | null
  created_by: string | null
  created_at: string
}

export function mapRowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    hashtag: row.hashtag,
    tags: row.tags,
    skinTone: row.skin_tone,
    fingers: row.fingers,
    preview: row.cover_src
      ? { type: 'curated', image: row.cover_src, alt: row.cover_alt ?? row.name, objectPosition: row.cover_object_position ?? undefined }
      : undefined,
  }
}

/** Public read — every template (admin-created and migrated seed), for Library/Studio. */
export async function fetchAllTemplates(): Promise<Template[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as TemplateRow[]).map(mapRowToTemplate)
}

/** Same rows as fetchAllTemplates, kept as raw TemplateRow so /admin can edit cover/tags directly. */
export async function fetchAllTemplatesAdmin(): Promise<TemplateRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data as TemplateRow[]
}

export interface TemplateInput {
  name: string
  hashtag: string
  tags: string[]
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  coverSrc?: string | null
  coverAlt?: string | null
  coverObjectPosition?: string | null
}

/** `id` is pre-slugified by the caller (see slugify() in lib/slug.ts) and checked for uniqueness there. */
export async function createTemplate(id: string, input: TemplateInput, createdBy: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('templates').insert({
    id,
    name: input.name,
    hashtag: input.hashtag,
    tags: input.tags,
    skin_tone: input.skinTone,
    fingers: input.fingers,
    cover_src: input.coverSrc ?? null,
    cover_alt: input.coverAlt ?? null,
    cover_object_position: input.coverObjectPosition ?? null,
    created_by: createdBy,
  })
  return { error: error?.message ?? null }
}

/** Partial update — /admin's edit form only sends the fields the admin actually changed. */
export async function updateTemplate(id: string, input: Partial<TemplateInput>): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.hashtag !== undefined) patch.hashtag = input.hashtag
  if (input.tags !== undefined) patch.tags = input.tags
  if (input.skinTone !== undefined) patch.skin_tone = input.skinTone
  if (input.fingers !== undefined) patch.fingers = input.fingers
  if (input.coverSrc !== undefined) patch.cover_src = input.coverSrc
  if (input.coverAlt !== undefined) patch.cover_alt = input.coverAlt
  if (input.coverObjectPosition !== undefined) patch.cover_object_position = input.coverObjectPosition
  const { error } = await supabase.from('templates').update(patch).eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteTemplate(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('templates').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export async function templateIdExists(id: string): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.from('templates').select('id').eq('id', id).maybeSingle()
  return Boolean(data)
}

export async function uploadTemplateCover(file: File, adminId: string): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Chưa kết nối Supabase.' }
  if (!ALLOWED_COVER_TYPES.includes(file.type)) {
    return { url: null, error: 'Chỉ nhận ảnh PNG, JPEG, WebP hoặc GIF.' }
  }
  if (file.size > MAX_COVER_BYTES) {
    return { url: null, error: 'Ảnh vượt quá 8MB, hãy chọn ảnh nhẹ hơn.' }
  }
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${adminId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(TEMPLATE_COVERS_BUCKET).upload(path, file, { upsert: false })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from(TEMPLATE_COVERS_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
