import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, QrCode, Ruler, Sticker as StickerIcon } from 'lucide-react'
import { useStudioStore, type StudioTab } from '@/store/studioStore'
import { useColorPresets } from '@/data/loaders'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { StudioTopBar } from '@/components/studio/StudioTopBar'
import { FingerSelector } from '@/components/studio/FingerSelector'
import { ShapeLengthTab } from '@/components/studio/ShapeLengthTab'
import { PaintTab } from '@/components/studio/PaintTab'
import { CharmsTab } from '@/components/studio/CharmsTab'
import { ResultView } from '@/components/studio/ResultView'
import { Button } from '@/components/ui/Button'
import { findTemplate } from '@/data/templates'
import { FINGER_LABEL_VI } from '@/types/vibeu'

const TABS: { id: StudioTab; label: string; icon: typeof Palette }[] = [
  { id: 'shape', label: 'Form & Độ dài', icon: Ruler },
  { id: 'paint', label: 'Hiệu ứng màu', icon: Palette },
  { id: 'charms', label: 'Thư viện Charm', icon: StickerIcon },
]

export default function Studio() {
  const [params] = useSearchParams()
  const s = useStudioStore()
  const { presets } = useColorPresets()
  const presetsById = Object.fromEntries(presets.map((p) => [p.id, p]))

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
        current.removeSticker(current.selectedFinger, current.selectedStickerInstance)
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
    <div className="flex h-screen flex-col bg-vibe-cream">
      <StudioTopBar skinTone={s.skinTone} onSkinTone={s.setSkinTone} onReset={s.reset} />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-4 py-5 sm:px-8">
          {s.activeTemplateName && (
            <span className="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-vibe-pink-dark shadow-sm">
              Đang chỉnh từ mẫu: {s.activeTemplateName}
            </span>
          )}
          <div className="w-full max-w-sm">
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
            />
          </div>
          <FingerSelector fingers={s.fingers} selected={s.selectedFinger} onSelect={s.selectFinger} presetsById={presetsById} />
          <p className="text-center text-xs text-vibe-ink-soft">
            Đang chỉnh: <span className="font-semibold text-vibe-ink">{FINGER_LABEL_VI[s.selectedFinger]}</span> — chạm charm để kéo, xoay, phóng to/thu nhỏ.
          </p>
        </div>

        <div className="flex flex-col border-t border-vibe-ink/10 bg-white/80 backdrop-blur lg:w-[420px] lg:border-l lg:border-t-0">
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

          <div className="flex-1 overflow-y-auto p-5 vibe-scrollbar">
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
                  <CharmsTab onAdd={(stickerId, variant) => s.addSticker(s.selectedFinger, stickerId, variant)} />
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
