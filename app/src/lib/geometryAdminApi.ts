import { supabase } from '@/lib/supabaseClient'
import type { HandData, NailLength, NailShape, SkinToneId } from '@/types/vibeu'

export interface GeometryOverride {
  coordinates: HandData
  updatedAt: string
}

export async function fetchGeometryOverride(
  tone: SkinToneId,
  shape: NailShape,
  length: NailLength,
): Promise<GeometryOverride | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('nail_geometry_variants')
    .select('coordinates, updated_at')
    .eq('tone', tone)
    .eq('shape', shape)
    .eq('length', length)
    .maybeSingle()
  if (error || !data) return null
  return {
    coordinates: data.coordinates as HandData,
    updatedAt: data.updated_at as string,
  }
}

export async function publishGeometryOverride(input: {
  tone: SkinToneId
  shape: NailShape
  length: NailLength
  coordinates: HandData
  updatedBy: string
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('nail_geometry_variants').upsert(
    {
      tone: input.tone,
      shape: input.shape,
      length: input.length,
      coordinates: input.coordinates,
      updated_by: input.updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tone,shape,length' },
  )
  return { error: error?.message ?? null }
}
