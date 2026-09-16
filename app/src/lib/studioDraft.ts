import type { DecalAsset, FingerId, SkinToneId, FingerDesign } from '@/types/vibeu'

const DRAFT_KEY = 'vibeu-studio-draft-v1'
/** Older than this, a draft is more likely to confuse ("why is my nail from 2 weeks ago back?")
 * than help — silently ignored and overwritten instead of ever being restored. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface StudioDraft {
  savedAt: number
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  customDecals: DecalAsset[]
}

/** Auto-backup of the in-progress design so a dropped connection/reload/tab crash while editing
 * in Studio doesn't lose work — see studioStore usage in Studio.tsx. Deliberately separate from
 * the account-level "Lưu thiết kế" (saveCurrentDesign/Supabase): this is a local-only safety net,
 * never synced, and is cleared the moment there's a real save or an explicit reset. Wrapped in
 * try/catch throughout since localStorage can throw (private browsing, storage full, disabled). */
export function saveStudioDraft(draft: Omit<StudioDraft, 'savedAt'>): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }))
  } catch {
    // Best-effort — losing the local backup is never worse than not having one.
  }
}

export function loadStudioDraft(): StudioDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StudioDraft
    if (!parsed || typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > MAX_AGE_MS) return null
    if (!parsed.fingers || !parsed.skinTone) return null
    return parsed
  } catch {
    return null
  }
}

export function clearStudioDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nothing to clean up if storage is unavailable in the first place.
  }
}
