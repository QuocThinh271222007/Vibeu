/** A real submitted photo for a post. Optional: without one, the card falls back to a
 * live HandCanvas render of the linked template — an explicit, honest "this is a design
 * preview, not a submitted photo" fallback. */
export interface CommunityMedia {
  src: string
  alt: string
  type: 'image'
  objectPosition?: string
}

export interface CommunityPost {
  id: string
  templateId: string
  userName: string
  handle: string
  avatarInitial: string
  avatarColor: string
  timeAgo: string
  caption: string
  hashtags: string[]
  likes: number
  comments: number
  media?: CommunityMedia
}

// The original 15 demo posts have been migrated into Supabase rows (see
// supabase/migrations/20260906_seed_static_content.sql) as guest-authored posts, so they can be
// edited/deleted from /admin — this stays [] as the offline-fallback shape Community.tsx merges
// remote posts into.
export const COMMUNITY_POSTS: CommunityPost[] = []
