import type { DecalAsset, FingerDesign, FingerId, SkinToneId } from '@/types/vibeu'

const STORAGE_KEY = 'vibeu:designs:v1'
const MAX_SLOTS = 20

export interface SavedDesign {
  version: 1
  id: string
  name: string
  savedAt: number
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  customDecals: DecalAsset[]
}

export type SavedDesignMeta = Pick<SavedDesign, 'id' | 'name' | 'savedAt' | 'skinTone'>

function readAll(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Fail safe on any future schema change: drop entries that don't look like ours
    // instead of crashing the whole list (and therefore the studio) on load.
    return parsed.filter((d): d is SavedDesign => d && d.version === 1 && typeof d.id === 'string' && typeof d.fingers === 'object')
  } catch {
    return []
  }
}

function writeAll(designs: SavedDesign[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs.slice(-MAX_SLOTS)))
  } catch {
    // Quota exceeded or storage disabled — the save silently no-ops rather than crashing;
    // the caller's UI is responsible for telling the user if they check the list afterward.
  }
}

export function listSavedDesigns(): SavedDesignMeta[] {
  return readAll()
    .map(({ id, name, savedAt, skinTone }) => ({ id, name, savedAt, skinTone }))
    .sort((a, b) => b.savedAt - a.savedAt)
}

export function saveDesign(
  name: string,
  skinTone: SkinToneId,
  fingers: Record<FingerId, FingerDesign>,
  customDecals: DecalAsset[],
): SavedDesign {
  const entry: SavedDesign = {
    version: 1,
    id: `design-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    name: name.trim() || 'Thiết kế chưa đặt tên',
    savedAt: Date.now(),
    skinTone,
    fingers,
    customDecals,
  }
  writeAll([...readAll(), entry])
  return entry
}

export function loadDesign(id: string): SavedDesign | null {
  return readAll().find((d) => d.id === id) ?? null
}

export function deleteDesign(id: string): void {
  writeAll(readAll().filter((d) => d.id !== id))
}
