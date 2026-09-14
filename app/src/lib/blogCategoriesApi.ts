import { supabase } from '@/lib/supabaseClient'

export interface BlogCategoryRow {
  id: string
  slug: string
  name: string
  created_at: string
  updated_at: string
}

/** Every "Danh mục", in creation order — used by the public Blog filter, the Admin editor's
 * picker, and the Admin category management page alike (RLS lets anyone read this table). */
export async function fetchAllBlogCategories(): Promise<BlogCategoryRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('blog_categories').select('*').order('created_at', { ascending: true })
  if (error || !data) return []
  return data as BlogCategoryRow[]
}

export interface BlogCategoryInput {
  slug: string
  name: string
}

export async function createBlogCategory(input: BlogCategoryInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('blog_categories').insert(input)
  return { error: error?.message ?? null }
}

export async function updateBlogCategory(id: string, input: BlogCategoryInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase
    .from('blog_categories')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteBlogCategory(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('blog_categories').delete().eq('id', id)
  return { error: error?.message ?? null }
}
