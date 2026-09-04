import { supabase } from '@/lib/supabaseClient'
import type { UserRole } from '@/store/authStore'

export interface AdminProfileRow {
  id: string
  email: string | null
  display_name: string
  handle: string | null
  avatar_color: string
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export async function fetchAllProfiles(): Promise<AdminProfileRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data as AdminProfileRow[]
}

export async function setUserRole(id: string, role: UserRole): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  return { error: error?.message ?? null }
}

export interface AdminCounts {
  users: number
  communityPosts: number
  blogPosts: number
  sharedDesigns: number
}

export async function fetchAdminCounts(): Promise<AdminCounts> {
  if (!supabase) return { users: 0, communityPosts: 0, blogPosts: 0, sharedDesigns: 0 }
  const [users, communityPosts, blogPosts, sharedDesigns] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('community_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('shared_designs').select('*', { count: 'exact', head: true }),
  ])
  return {
    users: users.count ?? 0,
    communityPosts: communityPosts.count ?? 0,
    blogPosts: blogPosts.count ?? 0,
    sharedDesigns: sharedDesigns.count ?? 0,
  }
}
