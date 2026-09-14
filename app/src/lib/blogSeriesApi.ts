import { supabase } from '@/lib/supabaseClient'

export interface BlogSeriesRow {
  id: string
  slug: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

/** Every mục lục, newest first — used by the public Blog filter, the Admin editor's picker,
 * and the Admin mục lục management page alike (RLS lets anyone read this table). */
export async function fetchAllBlogSeries(): Promise<BlogSeriesRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('blog_series').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data as BlogSeriesRow[]
}

export interface BlogSeriesInput {
  slug: string
  name: string
  description: string
}

export async function createBlogSeries(input: BlogSeriesInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('blog_series').insert(input)
  return { error: error?.message ?? null }
}

export async function updateBlogSeries(id: string, input: BlogSeriesInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase
    .from('blog_series')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteBlogSeries(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('blog_series').delete().eq('id', id)
  return { error: error?.message ?? null }
}
