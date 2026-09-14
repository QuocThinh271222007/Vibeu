import { supabase } from '@/lib/supabaseClient'

export interface DecalCategoryRow {
  id: string
  name_vi: string
  created_at: string
  updated_at: string
}

/** Every decal category, alphabetical by display name — the pick-list /admin/decals' category
 * dropdown and "Quản lý danh mục" panel both use. */
export async function fetchAllDecalCategories(): Promise<DecalCategoryRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('decal_categories').select('*').order('name_vi', { ascending: true })
  if (error || !data) return []
  return data as DecalCategoryRow[]
}

export async function createDecalCategory(id: string, nameVi: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('decal_categories').insert({ id, name_vi: nameVi })
  return { error: error?.message ?? null }
}

/** Renaming a category cascades into every `decals` row using it (kept denormalized there for
 * the Charm library's normal reads, so it never has to join against this table), so the two
 * never drift apart. Not atomic (two sequential requests) — acceptable for a low-concurrency
 * admin tool; worst case a rename mid-flight leaves a handful of decals briefly on the old
 * label until the admin retries. */
export async function updateDecalCategory(id: string, nameVi: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error: catError } = await supabase.from('decal_categories').update({ name_vi: nameVi, updated_at: new Date().toISOString() }).eq('id', id)
  if (catError) return { error: catError.message }
  const { error: decalsError } = await supabase.from('decals').update({ category_vi: nameVi }).eq('category', id)
  return { error: decalsError?.message ?? null }
}

export async function deleteDecalCategory(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('decal_categories').delete().eq('id', id)
  return { error: error?.message ?? null }
}
