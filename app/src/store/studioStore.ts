import { create } from 'zustand'
import { createSavedDesign, deleteSavedDesign as deleteSavedDesignApi, fetchSavedDesigns, type SavedDesignRow } from '@/lib/savedDesignsApi'
import { DEFAULT_LIGHT } from '@/lib/nailFill'
import { FINGER_ORDER, type CustomGradient, type DecalAsset, type DrawStroke, type FingerDesign, type FingerId, type NailLength, type NailShape, type SkinToneId, type StickerInstance, type Template } from '@/types/vibeu'

const DEFAULT_PRESET_ID = 'cloud-candy'
// Every preset in colors/manifest.json is a gradient/pattern (linear, radial, or aurora — no
// preset uses paint.mode 'solid'), so a fresh design used to always start on a rainbow gradient
// even though the "Màu đơn" color wheel's own handle already sat on this exact pink by default.
// Starting fingers with this as customColor makes the actual first paint match what that picker
// already implied, and gives new users a plain, easy default instead of a busy gradient.
const DEFAULT_SOLID_COLOR = '#FF92F9'
// "Trong suốt" (clear) is nearly all translucency (see MATERIAL_PROFILES.clear in nailFill.ts),
// so the chosen pigment barely shows through anyway — this is just a natural, warm nude-pink
// nail tone so a first-time pick of this effect doesn't default to whatever loud color was
// selected before switching to it.
const NATURAL_NAIL_COLOR = '#E7B3A0'
const MAX_HISTORY = 50

function defaultFinger(): FingerDesign {
  return {
    shape: 'oval',
    length: 'M',
    presetId: DEFAULT_PRESET_ID,
    customColor: DEFAULT_SOLID_COLOR,
    customGradient: null,
    effect: 'gel',
    stickers: [],
    drawStrokes: [],
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

let strokeCounter = 0
function nextStrokeId() {
  strokeCounter += 1
  return `stroke-${Date.now()}-${strokeCounter}`
}

export type StudioView = 'design' | 'result'
export type StudioTab = 'shape' | 'paint' | 'charms' | 'draw'

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
  /** Id of the loaded template, if any — used to look up its curated cover photo and lock
   * Studio into showing that exact photo (see lib/templateLock.ts). Cleared on reset; not
   * set when loading a saved design (those stay fully editable). */
  activeTemplateId: string | null
  /** User-uploaded decal assets, registered at runtime so they can be placed like any library decal. */
  customDecals: DecalAsset[]
  past: DesignSnapshot[]
  future: DesignSnapshot[]
  savedDesigns: SavedDesignRow[]
  /** QA-only overlay (mask outline, pointer/uv readout, decal bounds, normal/roughness/Fresnel
   * views) — off by default, never part of the design/history so toggling it can't be undone. */
  debugMode: boolean
  /** Freehand draw tool preferences — a tool/UI setting like debugMode, not part of the
   * design recipe itself (only the committed strokes in FingerDesign.drawStrokes are).
   * Whether draw mode is *active* is just `activeTab === 'draw'`, not separate state. */
  brushWidth: number
  brushColor: string
  /** 0..1 — see brushWidth/brushColor doc above, same "tool preference" treatment. */
  brushOpacity: number
  brushRender: 'embedded' | 'raised'
  /** Studio's "Ánh sáng" panel — a viewing/lighting preference, not part of the nail design
   * recipe itself (a template or saved design never specifies "how it was photographed"), so
   * — like debugMode — this is deliberately outside past/future undo history. Defaults match
   * DEFAULT_LIGHT in nailFill.ts exactly; `resetLighting` restores those calibrated values. */
  lightExposure: number
  lightStrength: number
  lightAngleDeg: number

  setSkinTone: (tone: SkinToneId) => void
  selectFinger: (finger: FingerId) => void
  setActiveTab: (tab: StudioTab) => void
  loadHandVariant: (tone: SkinToneId, shape: NailShape, length: NailLength) => void
  setShape: (finger: FingerId, shape: FingerDesign['shape'], applyToAll?: boolean) => void
  setLength: (finger: FingerId, length: FingerDesign['length'], applyToAll?: boolean) => void
  setPreset: (finger: FingerId, presetId: string, applyToAll?: boolean) => void
  setCustomColor: (finger: FingerId, hex: string | null, applyToAll?: boolean) => void
  setCustomGradient: (finger: FingerId, gradient: CustomGradient | null, applyToAll?: boolean) => void
  setEffect: (finger: FingerId, effect: FingerDesign['effect'], applyToAll?: boolean) => void
  addSticker: (finger: FingerId, stickerId: string, uv?: [number, number]) => void
  addStickerToAllFingers: (stickerId: string) => void
  addCustomDecal: (asset: DecalAsset) => void
  updateSticker: (finger: FingerId, instanceId: string, patch: Partial<StickerInstance>) => void
  removeSticker: (finger: FingerId, instanceId: string) => void
  duplicateSticker: (finger: FingerId, instanceId: string) => void
  setStickerVisible: (finger: FingerId, instanceId: string, visible: boolean) => void
  setStickerLocked: (finger: FingerId, instanceId: string, locked: boolean) => void
  reorderSticker: (finger: FingerId, instanceId: string, direction: 'up' | 'down') => void
  selectSticker: (instanceId: string | null) => void
  addStroke: (finger: FingerId, points: [number, number][], color: string, width: number, opacity: number, render: 'embedded' | 'raised') => void
  clearStrokes: (finger: FingerId) => void
  undoLastStroke: (finger: FingerId) => void
  reset: () => void
  loadTemplate: (template: Template) => void
  goToResult: () => void
  backToDesign: () => void
  undo: () => void
  redo: () => void
  toggleDebugMode: () => void
  setBrushWidth: (w: number) => void
  setBrushColor: (c: string) => void
  setBrushOpacity: (o: number) => void
  setBrushRender: (b: 'embedded' | 'raised') => void
  setLightExposure: (v: number) => void
  setLightStrength: (v: number) => void
  setLightAngleDeg: (v: number) => void
  resetLighting: () => void
  refreshSavedDesigns: (userId: string) => Promise<void>
  saveCurrentDesign: (userId: string, name: string) => Promise<{ error: string | null }>
  loadSavedDesign: (id: string) => void
  deleteSavedDesign: (id: string) => Promise<{ error: string | null }>
  loadSharedDesign: (payload: { skinTone: SkinToneId; fingers: Record<FingerId, FingerDesign>; customDecals: DecalAsset[] }) => void
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
  activeTemplateId: null,
  customDecals: [],
  past: [],
  future: [],
  savedDesigns: [],
  debugMode: false,
  brushWidth: 4,
  brushColor: '#FF2D87',
  brushOpacity: 0.85,
  brushRender: 'embedded',
  lightExposure: DEFAULT_LIGHT.exposure,
  lightStrength: DEFAULT_LIGHT.strength,
  lightAngleDeg: DEFAULT_LIGHT.angle,

  setSkinTone: (tone) => withHistory(set, () => ({ skinTone: tone })),
  selectFinger: (finger) => set({ selectedFinger: finger, selectedStickerInstance: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  loadHandVariant: (tone, shape, length) =>
    withHistory(set, (s) => {
      const next = { ...s.fingers }
      for (const finger of FINGER_ORDER) next[finger] = { ...next[finger], shape, length }
      return {
        skinTone: tone,
        fingers: next,
        activeTemplateName: null,
        activeTemplateId: null,
        selectedStickerInstance: null,
        view: 'design',
      }
    }),

  setShape: (finger, shape, applyToAll) =>
    withHistory(set, (s) => {
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], shape }
        return { fingers: next }
      }
      return { fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], shape } } }
    }),

  setLength: (finger, length, applyToAll) =>
    withHistory(set, (s) => {
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], length }
        return { fingers: next }
      }
      return { fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], length } } }
    }),

  setPreset: (finger, presetId, applyToAll) =>
    withHistory(set, (s) => {
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], presetId, customColor: null, customGradient: null }
        return { fingers: next }
      }
      return { fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], presetId, customColor: null, customGradient: null } } }
    }),

  setCustomColor: (finger, hex, applyToAll) =>
    withHistory(set, (s) => {
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], customColor: hex, customGradient: hex ? null : next[f].customGradient }
        return { fingers: next }
      }
      return {
        fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], customColor: hex, customGradient: hex ? null : s.fingers[finger].customGradient } },
      }
    }),

  setCustomGradient: (finger, gradient, applyToAll) =>
    withHistory(set, (s) => {
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], customGradient: gradient, customColor: gradient ? null : next[f].customColor }
        return { fingers: next }
      }
      return {
        fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], customGradient: gradient, customColor: gradient ? null : s.fingers[finger].customColor } },
      }
    }),

  setEffect: (finger, effect, applyToAll) =>
    withHistory(set, (s) => {
      // Picking "Trong suốt" defaults the pigment to a natural nail tone rather than
      // whatever loud preset/color was active before — see NATURAL_NAIL_COLOR above.
      const colorPatch = effect === 'clear' ? { customColor: NATURAL_NAIL_COLOR, customGradient: null } : {}
      if (applyToAll) {
        const next = { ...s.fingers }
        for (const f of FINGER_ORDER) next[f] = { ...next[f], effect, ...colorPatch }
        return { fingers: next }
      }
      return { fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], effect, ...colorPatch } } }
    }),

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

  addStickerToAllFingers: (stickerId) =>
    withHistory(set, (s) => {
      const next = { ...s.fingers }
      let selectedInstanceId: string | null = null
      for (const f of FINGER_ORDER) {
        const existing = next[f].stickers
        // uv is nail-local (0..1 in that finger's own uvFrame), not a raw pixel coordinate, so the
        // same centered uv already lands correctly on every finger's nail regardless of that
        // finger's actual position in coordinates.json / nail_geometry_variants — see localToImage.
        const instance: StickerInstance = {
          instanceId: nextInstanceId(),
          stickerId,
          uv: [0.5, 0.48],
          scale: 1,
          rotation: 0,
          flipX: false,
          opacity: 1,
          tint: null,
          visible: true,
          locked: false,
          z: existing.length,
        }
        next[f] = { ...next[f], stickers: [...existing, instance] }
        if (f === s.selectedFinger) selectedInstanceId = instance.instanceId
      }
      return { fingers: next, selectedStickerInstance: selectedInstanceId }
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

  addStroke: (finger, points, color, width, opacity, render) =>
    withHistory(set, (s) => {
      const stroke: DrawStroke = { id: nextStrokeId(), points, color, width, opacity, render }
      return {
        fingers: {
          ...s.fingers,
          [finger]: { ...s.fingers[finger], drawStrokes: [...s.fingers[finger].drawStrokes, stroke] },
        },
      }
    }),

  clearStrokes: (finger) =>
    withHistory(set, (s) => ({
      fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], drawStrokes: [] } },
    })),

  undoLastStroke: (finger) =>
    withHistory(set, (s) => ({
      fingers: { ...s.fingers, [finger]: { ...s.fingers[finger], drawStrokes: s.fingers[finger].drawStrokes.slice(0, -1) } },
    })),

  reset: () => withHistory(set, () => ({ fingers: defaultFingers(), selectedStickerInstance: null, view: 'design', activeTemplateName: null, activeTemplateId: null })),

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
        activeTemplateId: template.id,
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

  toggleDebugMode: () => set((s) => ({ debugMode: !s.debugMode })),
  setBrushWidth: (w) => set({ brushWidth: w }),
  setBrushColor: (c) => set({ brushColor: c }),
  setBrushOpacity: (o) => set({ brushOpacity: o }),
  setBrushRender: (b) => set({ brushRender: b }),

  setLightExposure: (v) => set({ lightExposure: Math.min(0.25, Math.max(-0.2, v)) }),
  setLightStrength: (v) => set({ lightStrength: Math.min(1, Math.max(0, v)) }),
  setLightAngleDeg: (v) => set({ lightAngleDeg: v }),
  resetLighting: () =>
    set({ lightExposure: DEFAULT_LIGHT.exposure, lightStrength: DEFAULT_LIGHT.strength, lightAngleDeg: DEFAULT_LIGHT.angle }),

  refreshSavedDesigns: async (userId) => {
    const list = await fetchSavedDesigns(userId)
    set({ savedDesigns: list })
  },

  saveCurrentDesign: async (userId, name) => {
    const s = get()
    const { error } = await createSavedDesign(userId, name, s.skinTone, s.fingers, s.customDecals)
    if (!error) {
      const list = await fetchSavedDesigns(userId)
      set({ savedDesigns: list })
    }
    return { error }
  },

  loadSavedDesign: (id) => {
    const found = get().savedDesigns.find((d) => d.id === id)
    if (!found) return
    withHistory(set, () => ({
      skinTone: found.skinTone,
      fingers: found.fingers,
      customDecals: found.customDecals,
      selectedStickerInstance: null,
      view: 'design',
      activeTemplateName: found.name,
      activeTemplateId: null,
    }))
  },

  deleteSavedDesign: async (id) => {
    const { error } = await deleteSavedDesignApi(id)
    if (!error) set((s) => ({ savedDesigns: s.savedDesigns.filter((d) => d.id !== id) }))
    return { error }
  },

  loadSharedDesign: (payload) =>
    withHistory(set, () => ({
      skinTone: payload.skinTone,
      fingers: payload.fingers,
      customDecals: payload.customDecals,
      selectedStickerInstance: null,
      view: 'design',
      activeTemplateName: null,
      activeTemplateId: null,
    })),
}))
