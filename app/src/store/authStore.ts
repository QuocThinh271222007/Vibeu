import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string | null
  displayName: string
  handle: string | null
  avatarColor: string
  role: UserRole
}

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut'

interface AuthState {
  status: AuthStatus
  profile: Profile | null
  /** True once init() has wired up the Supabase session listener — guards against double-subscribing in React StrictMode. */
  initialized: boolean
  init: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

function mapRow(row: {
  id: string
  email: string | null
  display_name: string
  handle: string | null
  avatar_color: string
  role: string
}): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    handle: row.handle,
    avatarColor: row.avatar_color,
    role: row.role === 'admin' ? 'admin' : 'user',
  }
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error || !data) return null
  return mapRow(data)
}

async function applySession(set: (partial: Partial<AuthState>) => void, session: Session | null) {
  if (!session) {
    set({ status: 'signedOut', profile: null })
    return
  }
  const profile = await fetchProfile(session.user.id)
  set({ status: 'signedIn', profile })
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  profile: null,
  initialized: false,

  init: () => {
    if (get().initialized) return
    set({ initialized: true })

    if (!isSupabaseConfigured || !supabase) {
      set({ status: 'signedOut' })
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      applySession(set, data.session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      applySession(set, session)
    })
  },

  signIn: async (email, password) => {
    if (!supabase) return { error: 'Chưa kết nối Supabase — không thể đăng nhập.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  },

  signUp: async (email, password, displayName) => {
    if (!supabase) return { error: 'Chưa kết nối Supabase — không thể đăng ký.', needsEmailConfirmation: false }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || undefined } },
    })
    if (error) return { error: error.message, needsEmailConfirmation: false }
    return { error: null, needsEmailConfirmation: !data.session }
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  },
}))
