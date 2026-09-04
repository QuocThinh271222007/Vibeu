import { COMMUNITY_MEDIA_BUCKET, supabase } from '@/lib/supabaseClient'

const ALLOWED_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_MEDIA_BYTES = 8 * 1024 * 1024

/** Postgres rate-limit triggers raise `RATE_LIMITED: <vietnamese message>` — strip the technical
 * prefix so the UI shows only the human-readable half; other errors pass through unchanged. */
export function friendlyDbError(message: string): string {
  const marker = 'RATE_LIMITED:'
  const idx = message.indexOf(marker)
  if (idx === -1) return message
  return message.slice(idx + marker.length).trim()
}

/** A community post backed by Supabase, shaped for direct rendering by Community.tsx's PostCard. */
export interface RemoteCommunityPost {
  id: string
  templateId: string | null
  userName: string
  handle: string
  avatarInitial: string
  avatarColor: string
  avatarUrl: string | null
  timeAgo: string
  caption: string
  hashtags: string[]
  likes: number
  comments: number
  media: { src: string; alt: string } | null
  authorId: string
  createdAt: string
  likedByMe: boolean
}

interface CommunityPostRow {
  id: string
  user_id: string
  template_id: string | null
  caption: string
  hashtags: string[]
  media_url: string | null
  media_alt: string | null
  likes_count: number
  comments_count: number
  created_at: string
  profiles: { display_name: string; handle: string | null; avatar_color: string; avatar_url: string | null } | null
}

function timeAgoVi(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'Vừa xong'
  if (min < 60) return `${min} phút trước`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} giờ trước`
  const day = Math.floor(hr / 24)
  return `${day} ngày trước`
}

function mapRow(row: CommunityPostRow, likedPostIds: Set<string>): RemoteCommunityPost {
  const name = row.profiles?.display_name ?? 'Thành viên VIBEU'
  return {
    id: row.id,
    templateId: row.template_id,
    userName: name,
    handle: row.profiles?.handle ?? '@vibeu',
    avatarInitial: name.trim().charAt(0).toUpperCase() || 'V',
    avatarColor: row.profiles?.avatar_color ?? '#90B8EB',
    avatarUrl: row.profiles?.avatar_url ?? null,
    timeAgo: timeAgoVi(row.created_at),
    caption: row.caption,
    hashtags: row.hashtags ?? [],
    likes: row.likes_count,
    comments: row.comments_count,
    media: row.media_url ? { src: row.media_url, alt: row.media_alt ?? '' } : null,
    authorId: row.user_id,
    createdAt: row.created_at,
    likedByMe: likedPostIds.has(row.id),
  }
}

export async function fetchCommunityPosts(currentUserId: string | null): Promise<RemoteCommunityPost[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('community_posts')
    .select('*, profiles(display_name, handle, avatar_color, avatar_url)')
    .order('created_at', { ascending: false })
  if (error || !data) return []

  let likedPostIds = new Set<string>()
  if (currentUserId) {
    const { data: likes } = await supabase.from('community_likes').select('post_id').eq('user_id', currentUserId)
    likedPostIds = new Set((likes ?? []).map((l) => l.post_id as string))
  }

  return (data as unknown as CommunityPostRow[]).map((row) => mapRow(row, likedPostIds))
}

export interface NewCommunityPostInput {
  userId: string
  templateId: string | null
  caption: string
  hashtags: string[]
  mediaUrl: string | null
  mediaAlt: string | null
}

export async function createCommunityPost(input: NewCommunityPostInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('community_posts').insert({
    user_id: input.userId,
    template_id: input.templateId,
    caption: input.caption,
    hashtags: input.hashtags,
    media_url: input.mediaUrl,
    media_alt: input.mediaAlt,
  })
  return { error: error ? friendlyDbError(error.message) : null }
}

export async function uploadCommunityMedia(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Chưa kết nối Supabase.' }
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    return { url: null, error: 'Chỉ nhận ảnh PNG, JPEG, WebP hoặc GIF.' }
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return { url: null, error: 'Ảnh vượt quá 8MB, hãy chọn ảnh nhẹ hơn.' }
  }
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).upload(path, file, { upsert: false })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from(COMMUNITY_MEDIA_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function setCommunityLike(postId: string, userId: string, liked: boolean): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  if (liked) {
    const { error } = await supabase.from('community_likes').insert({ post_id: postId, user_id: userId })
    return { error: error ? friendlyDbError(error.message) : null }
  }
  const { error } = await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId)
  return { error: error?.message ?? null }
}

export async function deleteCommunityPost(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('community_posts').delete().eq('id', id)
  return { error: error?.message ?? null }
}
