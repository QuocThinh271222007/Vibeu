import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Copy, Download, Send, Sparkles } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { Button } from '@/components/ui/Button'
import { useColorPresets, useDecals } from '@/data/loaders'
import { useStudioStore } from '@/store/studioStore'
import { buildShareUrl, buildSpecRows, generateShareId } from '@/lib/recipe'
import { useQrCode } from '@/lib/useQrCode'
import type { FingerDesign, FingerId, SkinToneId } from '@/types/vibeu'
import { useNavigate } from 'react-router-dom'

export function ResultView({
  skinTone,
  fingers,
  onBack,
}: {
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  onBack: () => void
}) {
  const { presets } = useColorPresets()
  const { decals } = useDecals()
  const customDecals = useStudioStore((s) => s.customDecals)
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)

  const shareId = useMemo(() => generateShareId(), [])
  const shareUrl = buildShareUrl(shareId)
  const qr = useQrCode(shareUrl)

  const presetsById = useMemo(() => Object.fromEntries(presets.map((p) => [p.id, p])), [presets])
  const stickersById = useMemo(() => Object.fromEntries([...decals, ...customDecals].map((d) => [d.id, d])), [decals, customDecals])
  const rows = useMemo(() => buildSpecRows(fingers, presetsById, stickersById), [fingers, presetsById, stickersById])

  function flashToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).catch(() => {})
    flashToast('Đã sao chép liên kết!')
  }

  function postToForum() {
    setPosted(true)
    flashToast('Đã đăng lên diễn đàn!')
    setTimeout(() => navigate('/community'), 1100)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="mb-6 flex items-center gap-3 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-vibe-ink shadow-sm transition-colors hover:bg-vibe-cream"
        >
          <ArrowLeft size={16} /> Sửa lại
        </button>
        <h1 className="font-display text-xl font-semibold text-vibe-ink sm:text-2xl">Công Thức Làm Móng</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-vibe-lg">
            <HandCanvas skinTone={skinTone} fingers={fingers} className="rounded-none" />
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] sm:p-6">
            <p className="mb-4 font-display text-sm font-semibold text-vibe-ink">Bảng thông số kỹ thuật</p>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.finger} className="flex items-start gap-3 rounded-2xl bg-vibe-cream/60 p-3">
                  <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-black/10 shadow-sm" style={{ background: r.colorSwatch }} />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-vibe-ink">
                      {r.fingerLabel} <span className="font-normal text-vibe-ink-soft">· {r.shapeLabel} · Dài {r.lengthLabel}</span>
                    </p>
                    <p className="text-vibe-ink-soft">
                      {r.colorLabel} · {r.effectLabel}
                      {r.charmNames.length > 0 && <> · Charm: {r.charmNames.join(', ')}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-[1.75rem] bg-white p-6 text-center shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]">
            <p className="font-display text-sm font-semibold text-vibe-ink">Mã QR Động</p>
            <div className="grid h-40 w-40 place-items-center rounded-2xl bg-vibe-cream p-3">
              {qr ? <img src={qr} alt="QR công thức" className="h-full w-full" /> : <Sparkles className="animate-pulse text-vibe-ink-soft" />}
            </div>
            <button onClick={copyLink} className="flex items-center gap-1.5 text-xs font-semibold text-vibe-blue-dark hover:underline">
              <Copy size={13} /> {shareUrl.replace('https://', '')}
            </button>
            <p className="text-xs text-vibe-ink-soft">Thợ quét mã bằng camera điện thoại để mở lại đúng bản thiết kế này.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              <Download size={18} /> Tải công thức HD
            </Button>
            <Button onClick={postToForum} disabled={posted}>
              {posted ? <Check size={18} /> : <Send size={18} />} Đăng lên Diễn đàn
            </Button>
          </div>
        </div>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-vibe-ink px-5 py-2.5 text-sm font-medium text-white shadow-vibe-lg print:hidden"
        >
          {toast}
        </motion.div>
      )}
    </div>
  )
}
