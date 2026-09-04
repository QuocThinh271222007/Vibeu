import { supabase } from '@/lib/supabaseClient'

const AVATAR_BUCKET = 'avatars'
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export interface ProfileUpdateInput {
  displayName?: string
  handle?: string | null
  avatarColor?: string
  avatarUrl?: string | null
}

export async function updateProfile(userId: string, input: ProfileUpdateInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const patch: Record<string, unknown> = {}
  if (input.displayName !== undefined) patch.display_name = input.displayName
  if (input.handle !== undefined) patch.handle = input.handle
  if (input.avatarColor !== undefined) patch.avatar_color = input.avatarColor
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  return { error: error?.message ?? null }
}

export async function uploadAvatar(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Chưa kết nối Supabase.' }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { url: null, error: 'Chỉ nhận ảnh PNG, JPEG hoặc WebP.' }
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { url: null, error: 'Ảnh đại diện vượt quá 2MB, hãy chọn ảnh nhẹ hơn.' }
  }
  const ext = file.name.split('.').pop() || 'jpg'
  // Fixed filename per user (not timestamped like community media) so old avatars don't pile up
  // in storage — `upsert: true` overwrites the previous one in place.
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  // Cache-bust so the new avatar shows immediately even though the URL/path is unchanged.
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}
