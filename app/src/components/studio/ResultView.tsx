import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Check, Copy, Download, ImageDown, Send, Sparkles } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { Button } from '@/components/ui/Button'
import { useColorPresets, useDecals } from '@/data/loaders'
import { useStudioStore } from '@/store/studioStore'
import { buildShareUrl, buildSpecRows, generateShareId } from '@/lib/recipe'
import { downloadBlob, exportDesignPng } from '@/lib/exportImage'
import { DEFAULT_LIGHT } from '@/lib/nailFill'
import { useQrCode } from '@/lib/useQrCode'
import { collectUsedCustomDecals, encodeSharedDesign, type SharedDesignPayload } from '@/lib/designCodec'
import { saveSharedDesign } from '@/lib/shareApi'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import type { FingerDesign, FingerId, SkinToneId } from '@/types/vibeu'
import { useNavigate } from 'react-router-dom'

// Keeps the URL — and therefore the QR image — comfortably scannable by an ordinary phone
// camera. Past this, embedding the whole design in the link stops being reliable, so the
// design is persisted to Supabase instead and the QR just carries the short id.
const FRAGMENT_SIZE_BUDGET = 1400

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
  const lightExposure = useStudioStore((s) => s.lightExposure)
  const lightStrength = useStudioStore((s) => s.lightStrength)
  const lightAngleDeg = useStudioStore((s) => s.lightAngleDeg)
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)
  const [exporting, setExporting] = useState(false)

  const shareId = useMemo(() => generateShareId(), [])
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareNotice, setShareNotice] = useState<string | null>(null)
  const qr = useQrCode(shareUrl ?? '')

  useEffect(() => {
    let cancelled = false

    async function run() {
      const payload: SharedDesignPayload = {
        skinTone,
        fingers,
        customDecals: collectUsedCustomDecals(fingers, customDecals),
        light: { exposure: lightExposure, strength: lightStrength, angleDeg: lightAngleDeg },
      }
      const fragment = await encodeSharedDesign(payload)
      if (cancelled) return
      const fits = fragment.length <= FRAGMENT_SIZE_BUDGET

      let notice: string | null = null
      if (isSupabaseConfigured) {
        const { error } = await saveSharedDesign(shareId, payload, profile?.id ?? null)
        if (cancelled) return
        if (!fits && error) {
          notice = 'Thiết kế khá chi tiết và không lưu được lên máy chủ — mã QR có thể không mở lại đúng bản thiết kế này.'
        }
      } else if (!fits) {
        notice =
          'Thiết kế có quá nhiều chi tiết (charm/nét vẽ tay) để nhúng gọn vào mã QR, và trang chưa kết nối Supabase để lưu dự phòng — mã QR này có thể không mở lại đúng. Kết nối Supabase hoặc đơn giản hoá thiết kế.'
      }

      if (cancelled) return
      setShareUrl(buildShareUrl(shareId, fits ? fragment : undefined))
      setShareNotice(notice)
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId])

  const presetsById = useMemo(() => Object.fromEntries(presets.map((p) => [p.id, p])), [presets])
  const stickersById = useMemo(() => Object.fromEntries([...decals, ...customDecals].map((d) => [d.id, d])), [decals, customDecals])
  const rows = useMemo(() => buildSpecRows(fingers, presetsById, stickersById), [fingers, presetsById, stickersById])

  function flashToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  function copyLink() {
    if (!shareUrl) return
    navigator.clipboard?.writeText(shareUrl).catch(() => {})
    flashToast('Đã sao chép liên kết!')
  }

  function postToForum() {
    setPosted(true)
    flashToast('Đã đăng lên diễn đàn!')
    setTimeout(() => navigate('/community'), 1100)
  }

  async function exportPng() {
    setExporting(true)
    try {
      // Matches Studio's user lighting exactly ("Ánh sáng" panel) so the exported PNG
      // reflects the same adjustments the user was looking at when they exported.
      const light = { ...DEFAULT_LIGHT, exposure: lightExposure, strength: lightStrength, angle: lightAngleDeg }
      const blob = await exportDesignPng(skinTone, fingers, presetsById, stickersById, light)
      downloadBlob(blob, `vibeu-nail-design-${Date.now()}.png`)
    } catch {
      flashToast('Xuất ảnh thất bại, thử lại nhé.')
    } finally {
      setExporting(false)
    }
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
            <button onClick={copyLink} disabled={!shareUrl} className="flex items-center gap-1.5 text-xs font-semibold text-vibe-blue-dark hover:underline disabled:opacity-50">
              <Copy size={13} /> {shareUrl ? shareUrl.replace(/^https?:\/\//, '') : 'Đang tạo liên kết...'}
            </button>
            {shareNotice ? (
              <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {shareNotice}
              </p>
            ) : (
              <p className="text-xs text-vibe-ink-soft">Thợ quét mã bằng camera điện thoại để mở lại đúng bản thiết kế này — dữ liệu được mã hoá ngay trong mã QR, không phụ thuộc máy chủ.</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              <Download size={18} /> Tải công thức HD
            </Button>
            <Button variant="secondary" onClick={exportPng} disabled={exporting}>
              <ImageDown size={18} /> {exporting ? 'Đang xuất ảnh…' : 'Xuất ảnh PNG (sạch)'}
            </Button>
            <Button className="sm:col-span-2" onClick={postToForum} disabled={posted}>
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
