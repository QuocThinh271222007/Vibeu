import { create } from 'zustand'
import { FINGER_ORDER, type CustomGradient, type FingerDesign, type FingerId, type SkinToneId, type StickerInstance, type Template } from '@/types/vibeu'

const DEFAULT_PRESET_ID = 'cloud-candy'

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

interface StudioState {
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  selectedFinger: FingerId
  activeTab: StudioTab
  selectedStickerInstance: string | null
  view: StudioView
  activeTemplateName: string | null

  setSkinTone: (tone: SkinToneId) => void
  selectFinger: (finger: FingerId) => void
  setActiveTab: (tab: StudioTab) => void
  setShape: (finger: FingerId, shape: FingerDesign['shape']) => void
  setLength: (finger: FingerId, length: FingerDesign['length']) => void
  setPreset: (finger: FingerId, presetId: string, applyToAll?: boolean) => void
  setCustomColor: (finger: FingerId, hex: string | null) => void
  setCustomGradient: (finger: FingerId, gradient: CustomGradient | null) => void
  setEffect: (finger: FingerId, effect: FingerDesign['effect']) => void
  addSticker: (finger: FingerId, stickerId: string, variant: StickerInstance['variant']) => void
  updateSticker: (finger: FingerId, instanceId: string, patch: Partial<StickerInstance>) => void
  removeSticker: (finger: FingerId, instanceId: string) => void
  duplicateSticker: (finger: FingerId, instanceId: string) => void
  selectSticker: (instanceId: string | null) => void
  reset: () => void
  loadTemplate: (template: Template) => void
  goToResult: () => void
  backToDesign: () => void
}

export const useStudioStore = create<StudioState>((set, get) => ({
  skinTone: 'cozy',
  fingers: defaultFingers(),
  selectedFinger: 'index',
  activeTab: 'paint',
  selectedStickerInstance: null,
  view: 'design',
  activeTemplateName: null,

  setSkinTone: (tone) => set({ skinTone: tone }),
  selectFinger: (finger) => set({ selectedFinger: finger, selectedStickerInstance: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  setShape: (finger, shape) =>
    set((s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], shape } } })),

  setLength: (finger, length) =>
    set((s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], length } } })),

  setPreset: (finger, presetId, applyToAll) =>
    set((s) => {
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], presetId, customColor: null, customGradient: null }
        return { fingers: next }
      }
      return { fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], presetId, customColor: null, customGradient: null } } }
    }),

  setCustomColor: (finger, hex) =>
    set((s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], customColor: hex, customGradient: hex ? null : s.fingers[finger].customGradient } } })),

  setCustomGradient: (finger, gradient) =>
    set((s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], customGradient: gradient, customColor: gradient ? null : s.fingers[finger].customColor } } })),

  setEffect: (finger, effect) =>
    set((s) => ({ fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], effect } } })),

  addSticker: (finger, stickerId, variant) =>
    set((s) => {
      const existing = s.fingers[finger].stickers
      const instance: StickerInstance = {
        instanceId: nextInstanceId(),
        stickerId,
        variant,
        uv: [0.5, 0.48],
        scale: 1,
        rotation: 0,
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

  updateSticker: (finger, instanceId, patch) =>
    set((s) => ({
      fingers: {
        ...s.fingers,
        [finger]: {
          ...s.fingers[finger],
          stickers: s.fingers[finger].stickers.map((st) => (st.instanceId === instanceId ? { ...st, ...patch } : st)),
        },
      },
    })),

  removeSticker: (finger, instanceId) =>
    set((s) => ({
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
    set((s) => {
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

  selectSticker: (instanceId) => set({ selectedStickerInstance: instanceId }),

  reset: () => set({ fingers: defaultFingers(), selectedStickerInstance: null, view: 'design', activeTemplateName: null }),

  loadTemplate: (template) =>
    set((s) => {
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
}))
