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
  avatarUrl: string | null
  role: UserRole
}

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut'

interface AuthState {
  status: AuthStatus
  profile: Profile | null
  /** True once init() has wired up the Supabase session listener — guards against double-subscribing in React StrictMode. */
  initialized: boolean
  init: () => void
  signIn: (email: string, password: string, captchaToken?: string | null) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    displayName: string,
    captchaToken?: string | null,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: string | null }>
  requestPasswordReset: (email: string, captchaToken?: string | null) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

function mapRow(row: {
  id: string
  email: string | null
  display_name: string
  handle: string | null
  avatar_color: string
  avatar_url: string | null
  role: string
}): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    handle: row.handle,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url ?? null,
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

function siteOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : ''
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

  signIn: async (email, password, captchaToken) => {
    if (!supabase) return { error: 'Chưa kết nối Supabase — không thể đăng nhập.' }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    })
    return { error: error?.message ?? null }
  },

  signUp: async (email, password, displayName, captchaToken) => {
    if (!supabase) return { error: 'Chưa kết nối Supabase — không thể đăng ký.', needsEmailConfirmation: false }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || undefined },
        emailRedirectTo: `${siteOrigin()}/auth`,
        captchaToken: captchaToken || undefined,
      },
    })
    if (error) return { error: error.message, needsEmailConfirmation: false }
    return { error: null, needsEmailConfirmation: !data.session }
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  },

  resendConfirmation: async (email) => {
    if (!supabase) return { error: 'Chưa kết nối Supabase.' }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${siteOrigin()}/auth` },
    })
    return { error: error?.message ?? null }
  },

  requestPasswordReset: async (email, captchaToken) => {
    if (!supabase) return { error: 'Chưa kết nối Supabase.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteOrigin()}/reset-password`,
      captchaToken: captchaToken || undefined,
    })
    return { error: error?.message ?? null }
  },

  updatePassword: async (newPassword) => {
    if (!supabase) return { error: 'Chưa kết nối Supabase.' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
  },

  refreshProfile: async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const profile = await fetchProfile(data.user.id)
    set({ profile })
  },
}))
