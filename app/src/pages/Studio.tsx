import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, PenLine, QrCode, Ruler, Sticker as StickerIcon, ZoomIn, ZoomOut } from 'lucide-react'
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
import { StudioReferenceBadge } from '@/components/studio/StudioReferenceBadge'
import { ResultView } from '@/components/studio/ResultView'
import { Button } from '@/components/ui/Button'
import { findTemplate } from '@/data/templates'
import { FINGER_LABEL_VI } from '@/types/vibeu'

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

export default function Studio() {
  const [params] = useSearchParams()
  const s = useStudioStore()
  const { presets } = useColorPresets()
  const presetsById = Object.fromEntries(presets.map((p) => [p.id, p]))
  const [zoomIndex, setZoomIndex] = useState(0)
  const zoom = ZOOM_LEVELS[zoomIndex]

  useEffect(() => {
    const templateId = params.get('template')
    if (templateId) {
      const tpl = findTemplate(templateId)
      if (tpl) s.loadTemplate(tpl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

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
        <ResultView skinTone={s.skinTone} fingers={s.fingers} onBack={s.backToDesign} />
      </div>
    )
  }

  const activeDesign = s.fingers[s.selectedFinger]

  return (
    <div className="flex min-h-screen flex-col bg-vibe-cream lg:h-screen lg:min-h-0">
      <StudioTopBar skinTone={s.skinTone} onSkinTone={s.setSkinTone} onReset={s.reset} />

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
        <div className="flex flex-col items-center gap-4 px-4 py-5 sm:px-8 lg:flex-1 lg:overflow-y-auto">
          {s.activeTemplateName && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-vibe-pink-dark shadow-sm">
                Đang chỉnh từ mẫu: {s.activeTemplateName}
              </span>
              <StudioReferenceBadge templateId={s.activeTemplateId} />
            </div>
          )}
          <div className="w-full shrink-0 transition-[max-width] duration-200" style={{ maxWidth: `${BASE_MAX_WIDTH_REM * zoom}rem` }}>
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
              onAddStroke={(finger, points) => s.addStroke(finger, points, s.brushColor, s.brushWidth)}
            />
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

          <FingerSelector fingers={s.fingers} selected={s.selectedFinger} onSelect={s.selectFinger} presetsById={presetsById} />
          <p className="text-center text-xs text-vibe-ink-soft">
            Đang chỉnh: <span className="font-semibold text-vibe-ink">{FINGER_LABEL_VI[s.selectedFinger]}</span> — chạm charm để kéo, xoay, phóng to/thu nhỏ.
          </p>

          <LightingPanel />
        </div>

        <div className="flex flex-col border-t border-vibe-ink/10 bg-white/80 backdrop-blur lg:min-h-0 lg:w-[420px] lg:border-l lg:border-t-0">
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

          <div className="p-5 vibe-scrollbar lg:flex-1 lg:overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div key={s.activeTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                {s.activeTab === 'shape' && (
                  <ShapeLengthTab
                    design={activeDesign}
                    onShape={(shape) => s.setShape(s.selectedFinger, shape)}
                    onLength={(length) => s.setLength(s.selectedFinger, length)}
                  />
                )}
                {s.activeTab === 'paint' && (
                  <PaintTab
                    design={activeDesign}
                    onPreset={(id, all) => s.setPreset(s.selectedFinger, id, all)}
                    onEffect={(effect) => s.setEffect(s.selectedFinger, effect)}
                    onCustomColor={(hex) => s.setCustomColor(s.selectedFinger, hex)}
                    onCustomGradient={(g) => s.setCustomGradient(s.selectedFinger, g)}
                  />
                )}
                {s.activeTab === 'charms' && (
                  <div className="space-y-5">
                    {activeDesign.stickers.length > 0 && <LayersPanel finger={s.selectedFinger} />}
                    <DecalLibrary onAdd={(decalId) => s.addSticker(s.selectedFinger, decalId)} />
                  </div>
                )}
                {s.activeTab === 'draw' && (
                  <DrawTab
                    brushWidth={s.brushWidth}
                    brushColor={s.brushColor}
                    hasStrokes={activeDesign.drawStrokes.length > 0}
                    onBrushWidth={s.setBrushWidth}
                    onBrushColor={s.setBrushColor}
                    onClear={() => s.clearStrokes(s.selectedFinger)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-t border-vibe-ink/10 p-4">
            <Button className="w-full" size="lg" onClick={s.goToResult}>
              <QrCode size={20} /> Xuất công thức &amp; Mã QR
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
