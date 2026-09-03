import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * False whenever the two VITE_SUPABASE_* env vars aren't set (e.g. a fresh clone with no
 * .env.local yet). Every feature that needs a backend (auth, posting, /admin) checks this
 * first and shows a "connect Supabase" notice instead of throwing on a null client.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url!, anonKey!) : null

export const COMMUNITY_MEDIA_BUCKET = 'community-media'
