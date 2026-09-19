import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { ChevronUp, History, Lock, Palette, PenLine, QrCode, Ruler, Sticker as StickerIcon, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useStudioStore, type StudioTab } from '@/store/studioStore'
import { useColorPresets } from '@/data/loaders'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { StudioTopBar } from '@/components/studio/StudioTopBar'
import { FingerSelector } from '@/components/studio/FingerSelector'
import { ShapeLengthTab } from '@/components/studio/ShapeLengthTab'
import { PaintTab } from '@/components/studio/PaintTab'
import { DrawTab } from '@/components/studio/DrawTab'
import { DecalLibrary } from '@/components/studio/DecalLibrary'
import { LayersPanel } from '@/components/studio/LayersPanel'
import { LightingPanel } from '@/components/studio/LightingPanel'
import { PageMeta } from '@/components/seo/PageMeta'
import { ResultView } from '@/components/studio/ResultView'
import { Button } from '@/components/ui/Button'
import { findTemplateAsync } from '@/data/templates'
import { fetchSavedDesign } from '@/lib/savedDesignsApi'
import { getLockedTemplateView } from '@/lib/templateLock'
import { clearStudioDraft, loadStudioDraft, saveStudioDraft } from '@/lib/studioDraft'
import { FINGER_LABEL_VI, type NailLength, type NailShape, type SkinToneId } from '@/types/vibeu'

const VALID_TONES = new Set<SkinToneId>(['cozy', 'matcha'])
const VALID_SHAPES = new Set<NailShape>(['oval', 'square', 'coffin', 'almond', 'stiletto'])
const VALID_LENGTHS = new Set<NailLength>(['S', 'M', 'L'])

const TABS: { id: StudioTab; label: string; icon: typeof Palette }[] = [
  { id: 'shape', label: 'Form & Độ dài', icon: Ruler },
  { id: 'paint', label: 'Hiệu ứng màu', icon: Palette },
  { id: 'charms', label: 'Thư viện Charm', icon: StickerIcon },
  { id: 'draw', label: 'Vẽ nail', icon: PenLine },
]

// 100%–200% in fixed steps. Zooms by simply widening the canvas's own max-width (the
// SVG inside scales with it via its aspect-ratio box) rather than a CSS transform/pinch
// gesture — that would fight the gizmo's own touch-none + pointer-capture drag handling
// on touch devices. This is lower-tech but has zero interaction risk: the page just
// scrolls to reach any part of the now-larger canvas.
const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2]
const BASE_MAX_WIDTH_REM = 24 // matches the previous static max-w-sm

// Everything Studio.tsx itself reads/calls — deliberately excludes fields it never renders
// from (lightExposure/lightStrength/lightAngleDeg, debugMode, savedDesigns, past/future) so
// dragging the lighting sliders or opening the save panel doesn't re-render this whole tree on
// every tick; those live behind their own fine-grained selectors in LightingPanel/StudioTopBar.
const STUDIO_SELECTOR = (st: ReturnType<typeof useStudioStore.getState>) => ({
  view: st.view,
  skinTone: st.skinTone,
  fingers: st.fingers,
  selectedFinger: st.selectedFinger,
  selectedStickerInstance: st.selectedStickerInstance,
  activeTab: st.activeTab,
  activeTemplateName: st.activeTemplateName,
  activeTemplateId: st.activeTemplateId,
  brushWidth: st.brushWidth,
  brushColor: st.brushColor,
  brushOpacity: st.brushOpacity,
  brushRender: st.brushRender,
  setActiveTab: st.setActiveTab,
  setShape: st.setShape,
  setLength: st.setLength,
  setPreset: st.setPreset,
  setEffect: st.setEffect,
  setCustomColor: st.setCustomColor,
  setCustomGradient: st.setCustomGradient,
  addStickerToAllFingers: st.addStickerToAllFingers,
  addSticker: st.addSticker,
  setBrushWidth: st.setBrushWidth,
  setBrushColor: st.setBrushColor,
  setBrushOpacity: st.setBrushOpacity,
  setBrushRender: st.setBrushRender,
  undoLastStroke: st.undoLastStroke,
  clearStrokes: st.clearStrokes,
  goToResult: st.goToResult,
  backToDesign: st.backToDesign,
  setSkinTone: st.setSkinTone,
  reset: st.reset,
  selectFinger: st.selectFinger,
  selectSticker: st.selectSticker,
  updateSticker: st.updateSticker,
  removeSticker: st.removeSticker,
  duplicateSticker: st.duplicateSticker,
  addStroke: st.addStroke,
  loadTemplate: st.loadTemplate,
  loadSharedDesign: st.loadSharedDesign,
})

export default function Studio() {
  const [params] = useSearchParams()
  const s = useStudioStore(useShallow(STUDIO_SELECTOR))
  const customDecals = useStudioStore((st) => st.customDecals)
  const pastLength = useStudioStore((st) => st.past.length)
  const { presets } = useColorPresets()
  const presetsById = Object.fromEntries(presets.map((p) => [p.id, p]))
  const [zoomIndex, setZoomIndex] = useState(0)
  // Mobile only (see the docked toggle bar below): the tools panel (tabs + settings + the
  // export button) is docked off-screen behind a toggle instead of sitting inline in the
  // page flow, so the canvas is fully reachable without scrolling past a wall of controls.
  // Desktop keeps its always-visible sidebar regardless of this.
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const appliedVariantRef = useRef('')
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const zoom = ZOOM_LEVELS[zoomIndex]

  // Local safety net (not the account-level "Lưu thiết kế"): if a customer's connection drops or
  // the tab crashes/reloads mid-edit, restore whatever they were working on instead of losing it —
  // see lib/studioDraft.ts. Skipped whenever the URL itself asks for something specific
  // (?template=/?design=/?tone+shape+length) — an explicit deep link should always win over an
  // old local draft. Runs once on mount only: params is read from the initial URL on purpose.
  useEffect(() => {
    const hasExplicitLoad = params.get('template') || params.get('design') || (params.get('tone') && params.get('shape') && params.get('length'))
    if (hasExplicitLoad) return
    const draft = loadStudioDraft()
    if (!draft) return
    useStudioStore.getState().loadSharedDesign(draft)
    setDraftRestored(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced so a drag/slider mid-gesture doesn't hit localStorage on every frame — only once
  // the user has actually made a change (s.past.length > 0) is there anything worth backing up.
  useEffect(() => {
    if (s.view !== 'design' || pastLength === 0) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      saveStudioDraft({ skinTone: s.skinTone, fingers: s.fingers, customDecals })
    }, 800)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.skinTone, s.fingers, customDecals, pastLength, s.view])

  useEffect(() => {
    const templateId = params.get('template')
    if (!templateId) return
    let alive = true
    findTemplateAsync(templateId).then((tpl) => {
      if (alive && tpl) s.loadTemplate(tpl)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    const designId = params.get('design')
    if (!designId) return
    let alive = true
    fetchSavedDesign(designId).then((d) => {
      if (alive && d) s.loadSharedDesign({ skinTone: d.skinTone, fingers: d.fingers, customDecals: d.customDecals })
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    const tone = params.get('tone') as SkinToneId | null
    const shape = params.get('shape') as NailShape | null
    const length = params.get('length')?.toUpperCase() as NailLength | undefined
    if (!tone || !shape || !length || !VALID_TONES.has(tone) || !VALID_SHAPES.has(shape) || !VALID_LENGTHS.has(length)) return
    const requestKey = `${tone}:${shape}-${length}`
    if (appliedVariantRef.current === requestKey) return
    appliedVariantRef.current = requestKey
    useStudioStore.getState().loadHandVariant(tone, shape, length)
  }, [params])

  // Freehand drawing needs more on-screen precision than a mouse gives at the default zoom
  // (unlike a stylus) — bump zoom up when entering Draw, but never fight a zoom the user
  // already picked themselves, and never zoom back out again when they leave the tab.
  useEffect(() => {
    if (s.activeTab === 'draw') setZoomIndex((i) => Math.max(i, 2))
  }, [s.activeTab])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const current = useStudioStore.getState()
      if ((e.key === 'Delete' || e.key === 'Backspace') && current.selectedStickerInstance) {
        e.preventDefault()
        const sticker = current.fingers[current.selectedFinger].stickers.find((st) => st.instanceId === current.selectedStickerInstance)
        if (!sticker?.locked) current.removeSticker(current.selectedFinger, current.selectedStickerInstance)
        return
      }
      const isUndoKey = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'
      if (isUndoKey) {
        e.preventDefault()
        if (e.shiftKey) current.redo()
        else current.undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        current.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (s.view === 'result') {
    return (
      <div className="min-h-screen bg-vibe-cream">
        <PageMeta title="Công thức & Mã QR" description="Xuất công thức làm nail và mã QR để mang ra tiệm." canonicalPath="/studio" />
        <ResultView skinTone={s.skinTone} fingers={s.fingers} onBack={s.backToDesign} />
      </div>
    )
  }

  const activeDesign = s.fingers[s.selectedFinger]
  const locked = getLockedTemplateView(s.activeTemplateId)
  const activeTabMeta = TABS.find((t) => t.id === s.activeTab) ?? TABS[0]

  // Shared between the always-visible desktop sidebar and the mobile docked sheet below —
  // same tabs/settings/export button either way, only the wrapping container differs.
  const toolsPanelContent = (
    <>
      {locked ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-vibe-pink/15 text-vibe-pink-dark">
            <Lock size={22} />
          </span>
          <p className="font-display text-base font-semibold text-vibe-ink">Đây là thiết kế mẫu có sẵn</p>
          <p className="text-sm font-medium text-vibe-ink-soft">Không thể chỉnh sửa.</p>
          <p className="max-w-xs text-sm text-vibe-ink-soft">
            Bạn vẫn có thể xuất công thức &amp; mã QR để mang ra tiệm, hoặc bấm "Reset" ở trên để tự do sáng tạo từ đầu.
          </p>
        </div>
      ) : (
        <>
          <div className="flex border-b border-vibe-ink/10">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => s.setActiveTab(t.id)}
                className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors sm:text-xs ${
                  s.activeTab === t.id ? 'text-vibe-pink-dark' : 'text-vibe-ink-soft'
                }`}
              >
                <t.icon size={18} />
                {t.label}
                {s.activeTab === t.id && <motion.span layoutId="tab-underline" className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-vibe-pink-dark" />}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 vibe-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div key={s.activeTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                {s.activeTab === 'shape' && (
                  <ShapeLengthTab
                    design={activeDesign}
                    skinTone={s.skinTone}
                    fingers={s.fingers}
                    onShape={(shape, all) => s.setShape(s.selectedFinger, shape, all)}
                    onLength={(length, all) => s.setLength(s.selectedFinger, length, all)}
                  />
                )}
                {s.activeTab === 'paint' && (
                  <PaintTab
                    design={activeDesign}
                    onPreset={(id, all) => s.setPreset(s.selectedFinger, id, all)}
                    onEffect={(effect, all) => s.setEffect(s.selectedFinger, effect, all)}
                    onCustomColor={(hex, all) => s.setCustomColor(s.selectedFinger, hex, all)}
                    onCustomGradient={(g, all) => s.setCustomGradient(s.selectedFinger, g, all)}
                  />
                )}
                {s.activeTab === 'charms' && (
                  <div className="space-y-5">
                    {activeDesign.stickers.length > 0 && <LayersPanel finger={s.selectedFinger} />}
                    <DecalLibrary
                      onAdd={(decalId, all) => (all ? s.addStickerToAllFingers(decalId) : s.addSticker(s.selectedFinger, decalId))}
                    />
                  </div>
                )}
                {s.activeTab === 'draw' && (
                  <DrawTab
                    brushWidth={s.brushWidth}
                    brushColor={s.brushColor}
                    brushOpacity={s.brushOpacity}
                    brushRender={s.brushRender}
                    hasStrokes={activeDesign.drawStrokes.length > 0}
                    onBrushWidth={s.setBrushWidth}
                    onBrushColor={s.setBrushColor}
                    onBrushOpacity={s.setBrushOpacity}
                    onBrushRender={s.setBrushRender}
                    onUndoLast={() => s.undoLastStroke(s.selectedFinger)}
                    onClear={() => s.clearStrokes(s.selectedFinger)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}

      <div className="border-t border-vibe-ink/10 p-4">
        <Button className="w-full" size="lg" onClick={s.goToResult}>
          <QrCode size={20} /> Xuất công thức &amp; Mã QR
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen flex-col bg-vibe-cream lg:h-screen lg:min-h-0">
      <PageMeta
        title={s.activeTemplateName ? `Studio — ${s.activeTemplateName}` : 'Nail Studio'}
        description="Tự thiết kế bộ nail của riêng bạn: chọn form móng, phối màu, đính charm 3D và xuất công thức mang ra tiệm."
        canonicalPath="/studio"
      />
      {/* Minimal and genuinely accurate on purpose — no fabricated rating/review, and offers is
          omitted entirely rather than guessing at a schema-correct way to represent "free". */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'VIBEU Nail Studio',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web',
          url: 'https://vibeu.design/studio',
        })}
      </script>
      <StudioTopBar
        skinTone={s.skinTone}
        onSkinTone={s.setSkinTone}
        onReset={() => {
          clearStudioDraft()
          s.reset()
        }}
      />

      {draftRestored && (
        <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-2xl border-2 border-vibe-blue/30 bg-vibe-blue/10 px-4 py-2.5 text-sm sm:mx-8">
          <History size={16} className="shrink-0 text-vibe-blue-dark" />
          <p className="flex-1 font-medium text-vibe-ink">Đã khôi phục thiết kế bạn đang làm dở lần trước.</p>
          <button
            onClick={() => {
              clearStudioDraft()
              s.reset()
              setDraftRestored(false)
            }}
            className="shrink-0 text-xs font-semibold text-vibe-ink-soft underline hover:text-vibe-ink"
          >
            Làm lại từ đầu
          </button>
          <button onClick={() => setDraftRestored(false)} className="shrink-0 rounded-full p-1 text-vibe-ink-soft hover:bg-white/60">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
        <div className="flex flex-col items-center gap-4 px-4 pb-24 pt-5 sm:px-8 lg:flex-1 lg:overflow-y-auto lg:pb-5">
          {/* The tool itself doesn't need a heading to be usable, but the page did — every other
              route has a real, visible h1, and this is the single most-linked page on the site.
              Kept visible at every width on purpose (not sr-only-below-sm): Google indexes with
              a mobile viewport by default, so hiding it on small screens would hide it from the
              exact crawl that matters most. */}
          <h1 className="text-center text-xs font-medium text-vibe-ink-soft">
            Nail Studio — thiết kế nail 3D miễn phí, xuất công thức và mã QR mang ra tiệm
          </h1>
          {s.activeTemplateName && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-vibe-pink-dark shadow-sm">
                {locked ? 'Mẫu có sẵn:' : 'Đang chỉnh từ mẫu:'} {s.activeTemplateName}
              </span>
              {locked && (
                <span className="flex items-center gap-1 rounded-full bg-vibe-ink px-3 py-1 text-xs font-semibold text-white">
                  <Lock size={12} /> Không thể chỉnh sửa
                </span>
              )}
            </div>
          )}
          <div className="w-full shrink-0 transition-[max-width] duration-200" style={{ maxWidth: `${BASE_MAX_WIDTH_REM * zoom}rem` }}>
            {locked ? (
              <div className="relative aspect-[1024/1536] w-full overflow-hidden rounded-[2rem] border-4 border-white shadow-vibe-lg">
                <img
                  src={locked.image}
                  alt={locked.alt}
                  style={{ objectPosition: locked.objectPosition }}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ) : (
              <HandCanvas
                skinTone={s.skinTone}
                fingers={s.fingers}
                interactive
                selectedFinger={s.selectedFinger}
                onSelectFinger={s.selectFinger}
                selectedStickerInstance={s.selectedStickerInstance}
                onSelectSticker={s.selectSticker}
                onUpdateSticker={s.updateSticker}
                onRemoveSticker={s.removeSticker}
                onDuplicateSticker={s.duplicateSticker}
                drawMode={s.activeTab === 'draw'}
                brushWidth={s.brushWidth}
                brushColor={s.brushColor}
                brushOpacity={s.brushOpacity}
                onAddStroke={(finger, points) => s.addStroke(finger, points, s.brushColor, s.brushWidth, s.brushOpacity, s.brushRender)}
              />
            )}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-1 shadow-sm">
            <button
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              title="Thu nhỏ"
              className="grid h-7 w-7 place-items-center rounded-full text-vibe-ink-soft transition-colors hover:bg-vibe-cream hover:text-vibe-ink disabled:opacity-30"
            >
              <ZoomOut size={15} />
            </button>
            <span className="w-11 text-center text-xs font-semibold text-vibe-ink">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              title="Phóng to"
              className="grid h-7 w-7 place-items-center rounded-full text-vibe-ink-soft transition-colors hover:bg-vibe-cream hover:text-vibe-ink disabled:opacity-30"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {!locked && (
            <>
              <FingerSelector fingers={s.fingers} selected={s.selectedFinger} onSelect={s.selectFinger} presetsById={presetsById} />
              <p className="text-center text-xs text-vibe-ink-soft">
                Đang chỉnh: <span className="font-semibold text-vibe-ink">{FINGER_LABEL_VI[s.selectedFinger]}</span> — chạm charm để kéo, xoay, phóng to/thu nhỏ.
              </p>
              <LightingPanel />
            </>
          )}
        </div>

        {/* Desktop: same panel, always visible as a static sidebar. */}
        <div className="hidden bg-white/80 backdrop-blur lg:flex lg:min-h-0 lg:w-[420px] lg:flex-col lg:border-l lg:border-vibe-ink/10">
          {toolsPanelContent}
        </div>
      </div>

      {/* Mobile: the same panel docked off-screen behind a toggle bar instead of sitting
          inline in the page flow — tap to slide the tools sheet up over the canvas, tap
          again (or the backdrop) to tuck it away. */}
      <button
        onClick={() => setMobileToolsOpen((v) => !v)}
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-center gap-2 border-t border-vibe-ink/10 bg-white text-sm font-semibold text-vibe-ink shadow-[0_-8px_24px_-16px_rgba(80,50,120,0.35)] lg:hidden"
      >
        {locked ? <Lock size={16} className="text-vibe-pink-dark" /> : <activeTabMeta.icon size={16} className="text-vibe-pink-dark" />}
        {locked ? 'Thông tin thiết kế mẫu' : `Công cụ: ${activeTabMeta.label}`}
        <ChevronUp size={16} className={`transition-transform ${mobileToolsOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {mobileToolsOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-30 bg-vibe-ink/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileToolsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-14 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-t-[1.75rem] border-t border-vibe-ink/10 bg-white shadow-2xl lg:hidden"
            >
              {toolsPanelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
