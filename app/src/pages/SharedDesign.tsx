import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ImageDown, Pencil, Sparkles } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { Button } from '@/components/ui/Button'
import { useColorPresets, useDecals } from '@/data/loaders'
import { buildSpecRows } from '@/lib/recipe'
import { decodeSharedDesign, type SharedDesignPayload } from '@/lib/designCodec'
import { fetchSharedDesign } from '@/lib/shareApi'
import { downloadBlob, exportDesignPng } from '@/lib/exportImage'
import { DEFAULT_LIGHT } from '@/lib/nailFill'
import { useStudioStore } from '@/store/studioStore'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { PageMeta } from '@/components/seo/PageMeta'

type LoadState = 'loading' | 'found' | 'not-found'

export default function SharedDesign() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { presets } = useColorPresets()
  const { decals } = useDecals()
  const [state, setState] = useState<LoadState>('loading')
  const [payload, setPayload] = useState<SharedDesignPayload | null>(null)
  const [exporting, setExporting] = useState(false)
  const loadSharedDesign = useStudioStore((s) => s.loadSharedDesign)

  useEffect(() => {
    let cancelled = false

    async function run() {
      // The design normally travels inside the URL itself (see designCodec.ts) — this works
      // with zero backend and is tried first regardless of whether Supabase is configured.
      const hash = window.location.hash
      const match = hash.match(/[#&]d=([^&]+)/)
      if (match) {
        const decoded = await decodeSharedDesign(match[1])
        if (cancelled) return
        if (decoded) {
          setPayload(decoded)
          setState('found')
          return
        }
      }

      if (id && isSupabaseConfigured) {
        const remote = await fetchSharedDesign(id)
        if (cancelled) return
        if (remote) {
          setPayload(remote)
          setState('found')
          return
        }
      }

      if (!cancelled) setState('not-found')
    }

    run()
    return () => {
      cancelled = true
    }
  }, [id])

  const presetsById = useMemo(() => Object.fromEntries(presets.map((p) => [p.id, p])), [presets])
  const stickersById = useMemo(
    () => Object.fromEntries([...decals, ...(payload?.customDecals ?? [])].map((d) => [d.id, d])),
    [decals, payload],
  )
  const rows = useMemo(() => (payload ? buildSpecRows(payload.fingers, presetsById, stickersById) : []), [payload, presetsById, stickersById])

  function openInStudio() {
    if (!payload) return
    loadSharedDesign({ skinTone: payload.skinTone, fingers: payload.fingers, customDecals: payload.customDecals })
    navigate('/studio')
  }

  async function exportPng() {
    if (!payload) return
    setExporting(true)
    try {
      const light = { ...DEFAULT_LIGHT, ...(payload.light ? { exposure: payload.light.exposure, strength: payload.light.strength, angle: payload.light.angleDeg } : {}) }
      const blob = await exportDesignPng(payload.skinTone, payload.fingers, presetsById, stickersById, light)
      downloadBlob(blob, `vibeu-nail-design-${id ?? 'shared'}.png`)
    } catch {
      // best-effort — no toast infrastructure on this minimal page
    } finally {
      setExporting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-vibe-cream">
        <Sparkles className="animate-pulse text-vibe-ink-soft" size={28} />
      </div>
    )
  }

  if (state === 'not-found' || !payload) {
    return (
      <div className="grid min-h-screen place-items-center bg-vibe-cream px-4">
        <div className="max-w-sm rounded-[2rem] bg-vibe-highlight p-8 text-center shadow-vibe-lg">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-vibe-cream">
            <AlertTriangle size={28} className="text-amber-500" />
          </div>
          <p className="font-display text-lg font-semibold text-vibe-ink">Không tìm thấy thiết kế</p>
          <p className="mt-2 text-sm text-vibe-ink-soft">
            Liên kết có thể đã bị cắt bớt khi chia sẻ (mất phần dữ liệu sau dấu #), hoặc thiết kế này chỉ được lưu tạm và chưa kết nối Supabase.
          </p>
          <button onClick={() => navigate('/studio')} className="mt-5 inline-block text-sm font-semibold text-vibe-pink-dark hover:underline">
            ← Tự thiết kế một bộ mới
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vibe-cream">
      <PageMeta
        title="Công thức làm móng"
        description="Bảng thông số kỹ thuật thiết kế nail từ VIBEU — mở lại chính xác từ mã QR, dùng để pha màu và lên form tại tiệm."
        canonicalPath={`/r/${id}`}
      />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-vibe-ink-soft hover:text-vibe-ink">
          <ArrowLeft size={16} /> Về trang chủ VIBEU
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-vibe-lg">
            <HandCanvas skinTone={payload.skinTone} fingers={payload.fingers} className="rounded-none" />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-vibe-ink">Công thức làm móng</h1>
              <p className="mt-1 text-sm text-vibe-ink-soft">Bản thiết kế được mở lại chính xác từ mã QR — dùng bảng dưới đây để pha màu và lên form.</p>
            </div>

            <div className="rounded-[1.75rem] bg-vibe-highlight p-5 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] sm:p-6">
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

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={exportPng} disabled={exporting}>
                <ImageDown size={18} /> {exporting ? 'Đang xuất ảnh…' : 'Xuất ảnh PNG'}
              </Button>
              <Button onClick={openInStudio}>
                <Pencil size={18} /> Mở trong Studio để chỉnh sửa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
