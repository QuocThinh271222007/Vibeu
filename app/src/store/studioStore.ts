import { create } from 'zustand'
import { deleteDesign, listSavedDesigns, loadDesign, saveDesign, type SavedDesignMeta } from '@/lib/persistence'
import { FINGER_ORDER, type CustomGradient, type DecalAsset, type FingerDesign, type FingerId, type SkinToneId, type StickerInstance, type Template } from '@/types/vibeu'

const DEFAULT_PRESET_ID = 'cloud-candy'
const MAX_HISTORY = 50

function defaultFinger(): FingerDesign {
  return {
    shape: 'oval',
    length: 'M',
    presetId: DEFAULT_PRESET_ID,
    customColor: null,
    customGradient: null,
    effect: 'gel',
    stickers: [],
  }
}

function defaultFingers(): Record<FingerId, FingerDesign> {
  return {
    thumb: defaultFinger(),
    index: defaultFinger(),
    middle: defaultFinger(),
    ring: defaultFinger(),
    little: defaultFinger(),
  }
}

let instanceCounter = 0
function nextInstanceId() {
  instanceCounter += 1
  return `sticker-${Date.now()}-${instanceCounter}`
}

export type StudioView = 'design' | 'result'
export type StudioTab = 'shape' | 'paint' | 'charms'

/** The part of the design that undo/redo and save/load actually operate on. */
interface DesignSnapshot {
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
}

interface StudioState extends DesignSnapshot {
  selectedFinger: FingerId
  activeTab: StudioTab
  selectedStickerInstance: string | null
  view: StudioView
  activeTemplateName: string | null
  /** User-uploaded decal assets, registered at runtime so they can be placed like any library decal. */
  customDecals: DecalAsset[]
  past: DesignSnapshot[]
  future: DesignSnapshot[]
  savedDesigns: SavedDesignMeta[]

  setSkinTone: (tone: SkinToneId) => void
  selectFinger: (finger: FingerId) => void
  setActiveTab: (tab: StudioTab) => void
  setShape: (finger: FingerId, shape: FingerDesign['shape']) => void
  setLength: (finger: FingerId, length: FingerDesign['length']) => void
  setPreset: (finger: FingerId, presetId: string, applyToAll?: boolean) => void
  setCustomColor: (finger: FingerId, hex: string | null) => void
  setCustomGradient: (finger: FingerId, gradient: CustomGradient | null) => void
  setEffect: (finger: FingerId, effect: FingerDesign['effect']) => void
  addSticker: (finger: FingerId, stickerId: string, uv?: [number, number]) => void
  addCustomDecal: (asset: DecalAsset) => void
  updateSticker: (finger: FingerId, instanceId: string, patch: Partial<StickerInstance>) => void
  removeSticker: (finger: FingerId, instanceId: string) => void
  duplicateSticker: (finger: FingerId, instanceId: string) => void
  setStickerVisible: (finger: FingerId, instanceId: string, visible: boolean) => void
  setStickerLocked: (finger: FingerId, instanceId: string, locked: boolean) => void
  reorderSticker: (finger: FingerId, instanceId: string, direction: 'up' | 'down') => void
  selectSticker: (instanceId: string | null) => void
  reset: () => void
  loadTemplate: (template: Template) => void
  goToResult: () => void
  backToDesign: () => void
  undo: () => void
  redo: () => void
  refreshSavedDesigns: () => void
  saveCurrentDesign: (name: string) => void
  loadSavedDesign: (id: string) => void
  deleteSavedDesign: (id: string) => void
}

/** Every design-mutating action goes through this so undo/redo stays correct without
 * having to remember to wire history into each action by hand. Commits happen at
 * interaction boundaries (a finished drag, a click) — see the LiveDragOverride perf
 * note in HandCanvas.tsx for why intermediate drag frames never reach the store at all. */
function withHistory(
  set: (fn: (s: StudioState) => Partial<StudioState>) => void,
  updater: (s: StudioState) => Partial<DesignSnapshot> & Partial<StudioState>,
) {
  set((s) => {
    const entry: DesignSnapshot = { skinTone: s.skinTone, fingers: s.fingers }
    const past = [...s.past, entry].slice(-MAX_HISTORY)
    return { ...updater(s), past, future: [] }
  })
}

export const useStudioStore = create<StudioState>((set, get) => ({
  skinTone: 'cozy',
  fingers: defaultFingers(),
  selectedFinger: 'index',
  activeTab: 'paint',
  selectedStickerInstance: null,
  view: 'design',
  activeTemplateName: null,
  customDecals: [],
  past: [],
  future: [],
  savedDesigns: listSavedDesigns(),

  setSkinTone: (tone) => withHistory(set, () => ({ skinTone: tone })),
  selectFinger: (finger) => set({ selectedFinger: finger, selectedStickerInstance: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  setShape: (finger, shape) =>
    withHistory(set, (s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], shape } } })),

  setLength: (finger, length) =>
    withHistory(set, (s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], length } } })),

  setPreset: (finger, presetId, applyToAll) =>
    withHistory(set, (s) => {
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], presetId, customColor: null, customGradient: null }
        return { fingers: next }
      }
      return { fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], presetId, customColor: null, customGradient: null } } }
    }),

  setCustomColor: (finger, hex) =>
    withHistory(set, (s) => ({
      fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], customColor: hex, customGradient: hex ? null : s.fingers[finger].customGradient } },
    })),

  setCustomGradient: (finger, gradient) =>
    withHistory(set, (s) => ({
      fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], customGradient: gradient, customColor: gradient ? null : s.fingers[finger].customColor } },
    })),

  setEffect: (finger, effect) =>
    withHistory(set, (s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], effect } } })),

  addSticker: (finger, stickerId, uv) =>
    withHistory(set, (s) => {
      const existing = s.fingers[finger].stickers
      const instance: StickerInstance = {
        instanceId: nextInstanceId(),
        stickerId,
        uv: uv ?? [0.5, 0.48],
        scale: 1,
        rotation: 0,
        flipX: false,
        opacity: 1,
        tint: null,
        visible: true,
        locked: false,
        z: existing.length,
      }
      return {
        fingers: {
          ...s.fingers,
          [finger]: { ...s.fingers[finger], stickers: [...existing, instance] },
        },
        selectedStickerInstance: instance.instanceId,
        selectedFinger: finger,
      }
    }),

  addCustomDecal: (asset) => set((s) => ({ customDecals: [...s.customDecals.filter((d) => d.id !== asset.id), asset] })),

  updateSticker: (finger, instanceId, patch) =>
    withHistory(set, (s) => ({
      fingers: {
        ...s.fingers,
        [finger]: {
          ...s.fingers[finger],
          stickers: s.fingers[finger].stickers.map((st) => (st.instanceId === instanceId ? { ...st, ...patch } : st)),
        },
      },
    })),

  removeSticker: (finger, instanceId) =>
    withHistory(set, (s) => ({
      fingers: {
        ...s.fingers,
        [finger]: {
          ...s.fingers[finger],
          stickers: s.fingers[finger].stickers.filter((st) => st.instanceId !== instanceId),
        },
      },
      selectedStickerInstance: get().selectedStickerInstance === instanceId ? null : get().selectedStickerInstance,
    })),

  duplicateSticker: (finger, instanceId) =>
    withHistory(set, (s) => {
      const src = s.fingers[finger].stickers.find((st) => st.instanceId === instanceId)
      if (!src) return s
      const copy: StickerInstance = {
        ...src,
        instanceId: nextInstanceId(),
        uv: [Math.min(0.85, src.uv[0] + 0.08), Math.min(0.85, src.uv[1] + 0.06)],
        z: s.fingers[finger].stickers.length,
      }
      return {
        fingers: {
          ...s.fingers,
          [finger]: { ...s.fingers[finger], stickers: [...s.fingers[finger].stickers, copy] },
        },
        selectedStickerInstance: copy.instanceId,
      }
    }),

  setStickerVisible: (finger, instanceId, visible) =>
    withHistory(set, (s) => ({
      fingers: {
        ...s.fingers,
        [finger]: {
          ...s.fingers[finger],
          stickers: s.fingers[finger].stickers.map((st) => (st.instanceId === instanceId ? { ...st, visible } : st)),
        },
      },
    })),

  setStickerLocked: (finger, instanceId, locked) =>
    withHistory(set, (s) => ({
      fingers: {
        ...s.fingers,
        [finger]: {
          ...s.fingers[finger],
          stickers: s.fingers[finger].stickers.map((st) => (st.instanceId === instanceId ? { ...st, locked } : st)),
        },
      },
    })),

  reorderSticker: (finger, instanceId, direction) =>
    withHistory(set, (s) => {
      const sorted = [...s.fingers[finger].stickers].sort((a, b) => a.z - b.z)
      const idx = sorted.findIndex((st) => st.instanceId === instanceId)
      const swapWith = direction === 'up' ? idx + 1 : idx - 1
      if (idx < 0 || swapWith < 0 || swapWith >= sorted.length) return s
      const zA = sorted[idx].z
      const zB = sorted[swapWith].z
      const stickers = s.fingers[finger].stickers.map((st) => {
        if (st.instanceId === sorted[idx].instanceId) return { ...st, z: zB }
        if (st.instanceId === sorted[swapWith].instanceId) return { ...st, z: zA }
        return st
      })
      return { fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], stickers } } }
    }),

  selectSticker: (instanceId) => set({ selectedStickerInstance: instanceId }),

  reset: () => withHistory(set, () => ({ fingers: defaultFingers(), selectedStickerInstance: null, view: 'design', activeTemplateName: null })),

  loadTemplate: (template) =>
    withHistory(set, (s) => {
      const next = defaultFingers()
      for (const f of FINGER_ORDER) {
        const patch = template.fingers[f]
        if (patch) {
          next[f] = {
            ...next[f],
            ...patch,
            stickers: (patch.stickers ?? []).map((st) => ({ ...st, instanceId: nextInstanceId() })),
          }
        }
      }
      return {
        fingers: next,
        skinTone: template.skinTone,
        view: 'design',
        selectedStickerInstance: null,
        activeTemplateName: template.name,
        selectedFinger: s.selectedFinger,
      }
    }),

  goToResult: () => set({ view: 'result', selectedStickerInstance: null }),
  backToDesign: () => set({ view: 'design' }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s
      const prev = s.past[s.past.length - 1]
      const current: DesignSnapshot = { skinTone: s.skinTone, fingers: s.fingers }
      return {
        skinTone: prev.skinTone,
        fingers: prev.fingers,
        past: s.past.slice(0, -1),
        future: [current, ...s.future].slice(0, MAX_HISTORY),
        selectedStickerInstance: null,
      }
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s
      const next = s.future[0]
      const current: DesignSnapshot = { skinTone: s.skinTone, fingers: s.fingers }
      return {
        skinTone: next.skinTone,
        fingers: next.fingers,
        past: [...s.past, current].slice(-MAX_HISTORY),
        future: s.future.slice(1),
        selectedStickerInstance: null,
      }
    }),

  refreshSavedDesigns: () => set({ savedDesigns: listSavedDesigns() }),

  saveCurrentDesign: (name) => {
    const s = get()
    saveDesign(name, s.skinTone, s.fingers, s.customDecals)
    set({ savedDesigns: listSavedDesigns() })
  },

  loadSavedDesign: (id) => {
    const found = loadDesign(id)
    if (!found) return
    withHistory(set, () => ({
      skinTone: found.skinTone,
      fingers: found.fingers,
      customDecals: found.customDecals,
      selectedStickerInstance: null,
      view: 'design',
      activeTemplateName: found.name,
    }))
  },

  deleteSavedDesign: (id) => {
    deleteDesign(id)
    set({ savedDesigns: listSavedDesigns() })
  },
}))
