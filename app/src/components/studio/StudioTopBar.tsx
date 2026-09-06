import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bug, ExternalLink, FolderOpen, LibraryBig, Redo2, RefreshCcw, Save, Trash2, Undo2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { TEMPLATE_TAGS } from '@/data/templateTags'
import { createTemplate, templateIdExists } from '@/lib/templatesApi'
import { slugify } from '@/lib/slug'
import { useAuthStore } from '@/store/authStore'
import { useStudioStore } from '@/store/studioStore'
import type { SkinToneId } from '@/types/vibeu'

// Labels previously had it backwards: 'cozy' is actually the fairer/lighter-toned hand
// photo and 'matcha' the deeper/warmer-toned one, but they were labeled "Ấm" (warm) and
// "Sáng" (light) respectively — the opposite of what each photo actually shows (user
// report: "da ấm và da sáng đang ngược nhau"). Internal ids (cozy/matcha) are left alone
// since they're referenced throughout templates.ts/loaders.ts/asset paths — only the
// user-facing label + swatch color are corrected here to match the real photos.
const SKIN_TONES: { id: SkinToneId; label: string; swatch: string }[] = [
  { id: 'cozy', label: 'Sáng', swatch: '#F0C9B4' },
  { id: 'matcha', label: 'Ấm', swatch: '#C68A65' },
]

export function StudioTopBar({
  skinTone,
  onSkinTone,
  onReset,
}: {
  skinTone: SkinToneId
  onSkinTone: (t: SkinToneId) => void
  onReset: () => void
}) {
  const navigate = useNavigate()
  const past = useStudioStore((s) => s.past)
  const future = useStudioStore((s) => s.future)
  const undo = useStudioStore((s) => s.undo)
  const redo = useStudioStore((s) => s.redo)
  const debugMode = useStudioStore((s) => s.debugMode)
  const toggleDebugMode = useStudioStore((s) => s.toggleDebugMode)
  const [savePanelOpen, setSavePanelOpen] = useState(false)
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false)
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin')

  return (
    <div className="relative flex items-center justify-between gap-3 overflow-x-auto border-b border-vibe-ink/10 bg-white/80 px-4 py-3 backdrop-blur no-scrollbar">
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-2 text-sm font-semibold text-vibe-ink transition-colors hover:bg-vibe-pink hover:text-white"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Quay lại</span>
        </button>
        <div className="hidden sm:block">
          <Logo />
        </div>
        <div className="ml-1 flex items-center gap-1 rounded-full bg-vibe-cream p-1">
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Hoàn tác (Ctrl+Z)"
            className="grid h-8 w-8 place-items-center rounded-full text-vibe-ink-soft transition-colors hover:bg-white hover:text-vibe-ink disabled:opacity-30"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Làm lại (Ctrl+Shift+Z)"
            className="grid h-8 w-8 place-items-center rounded-full text-vibe-ink-soft transition-colors hover:bg-white hover:text-vibe-ink disabled:opacity-30"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-full bg-vibe-cream p-1">
        {SKIN_TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSkinTone(t.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              skinTone === t.id ? 'bg-white shadow-sm text-vibe-ink' : 'text-vibe-ink-soft'
            }`}
          >
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: t.swatch }} />
            Da {t.label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href="https://shopee.vn"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm font-medium text-vibe-ink-soft transition-colors hover:border-vibe-blue/50 hover:text-vibe-ink sm:flex"
        >
          Shopee <ExternalLink size={14} />
        </a>
        <button
          onClick={() => setSavePanelOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm font-medium text-vibe-ink-soft transition-colors hover:border-vibe-blue/50 hover:text-vibe-ink"
        >
          <Save size={15} /> <span className="hidden sm:inline">Lưu / Mở</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setTemplatePanelOpen((v) => !v)}
            title="Lưu thiết kế hiện tại thành mẫu công khai trong Thư viện mẫu"
            className="flex items-center gap-1.5 rounded-full border-2 border-vibe-pink/30 bg-vibe-pink/5 px-3.5 py-2 text-sm font-medium text-vibe-pink-dark transition-colors hover:border-vibe-pink/60"
          >
            <LibraryBig size={15} /> <span className="hidden sm:inline">Lưu làm mẫu</span>
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm font-medium text-vibe-ink-soft transition-colors hover:border-vibe-pink/50 hover:text-vibe-ink"
        >
          <RefreshCcw size={15} /> <span className="hidden sm:inline">Reset</span>
        </button>
        {isAdmin && (
          <button
            onClick={toggleDebugMode}
            title="Chế độ debug (QA only): viền mask, tọa độ con trỏ, khung decal, chế độ xem normal/roughness/Fresnel"
            className={`hidden items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-medium transition-colors sm:flex ${
              debugMode ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-vibe-ink/10 text-vibe-ink-soft hover:border-amber-400/50 hover:text-vibe-ink'
            }`}
          >
            <Bug size={15} /> <span className="hidden sm:inline">Debug</span>
          </button>
        )}
      </div>

      {savePanelOpen && <SavePanel onClose={() => setSavePanelOpen(false)} />}
      {templatePanelOpen && <SaveTemplatePanel onClose={() => setTemplatePanelOpen(false)} />}
    </div>
  )
}

function SaveTemplatePanel({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const skinTone = useStudioStore((s) => s.skinTone)
  const fingers = useStudioStore((s) => s.fingers)
  const [name, setName] = useState('')
  const [hashtag, setHashtag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function toggleTag(id: string) {
    setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
  }

  async function handleSave() {
    if (!profile || !name.trim()) return
    setSaving(true)
    setError(null)
    let id = slugify(name)
    if (!id) id = `mau-${Date.now()}`
    // Slugs collide easily on short Vietnamese names ("Mùa Xuân" -> "mua-xuan") once a few
    // templates exist — suffix with a short counter instead of failing the save outright.
    let suffix = 2
    while (await templateIdExists(id)) {
      id = `${slugify(name)}-${suffix}`
      suffix += 1
    }
    const { error } = await createTemplate(id, { name: name.trim(), hashtag, tags, skinTone, fingers }, profile.id)
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    setDone(true)
  }

  return (
    <div className="absolute right-4 top-full z-20 mt-2 w-80 rounded-2xl border border-vibe-ink/10 bg-white p-4 shadow-vibe-lg">
      {done ? (
        <div className="py-2 text-center">
          <p className="text-sm font-semibold text-vibe-ink">Đã lưu vào Thư viện mẫu!</p>
          <button onClick={onClose} className="mt-3 rounded-full bg-vibe-ink px-4 py-1.5 text-xs font-semibold text-white">
            Đóng
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-vibe-ink">Lưu thiết kế hiện tại làm mẫu</p>
          <p className="mt-1 text-xs text-vibe-ink-soft">Mẫu sẽ hiện công khai ở Thư viện mẫu, dùng ảnh render trực tiếp (không cần ảnh bìa).</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên mẫu…"
            className="mt-3 w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
          />
          <input
            value={hashtag}
            onChange={(e) => setHashtag(e.target.value)}
            placeholder="#Hashtag #ChoTemPlate"
            className="mt-2 w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TEMPLATE_TAGS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  tags.includes(t.id) ? 'border-vibe-pink bg-vibe-pink/10 text-vibe-pink-dark' : 'border-vibe-ink/10 text-vibe-ink-soft'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-vibe-ink-soft">
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="rounded-full bg-vibe-ink px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              {saving ? 'Đang lưu...' : 'Lưu mẫu'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SavePanel({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedDesigns = useStudioStore((s) => s.savedDesigns)
  const refreshSavedDesigns = useStudioStore((s) => s.refreshSavedDesigns)
  const saveCurrentDesign = useStudioStore((s) => s.saveCurrentDesign)
  const loadSavedDesign = useStudioStore((s) => s.loadSavedDesign)
  const deleteSavedDesign = useStudioStore((s) => s.deleteSavedDesign)

  useEffect(() => {
    if (profile) refreshSavedDesigns(profile.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  if (!profile) {
    return (
      <div className="absolute right-4 top-full z-20 mt-2 w-72 rounded-2xl border border-vibe-ink/10 bg-white p-4 text-center shadow-vibe-lg">
        <p className="text-sm text-vibe-ink-soft">Đăng nhập để lưu thiết kế vào tài khoản — xem lại ở mọi thiết bị, hiện trong "Bộ sưu tập" ở trang cá nhân.</p>
        <Link to="/auth?redirect=/studio" className="mt-3 inline-block rounded-full bg-vibe-ink px-4 py-1.5 text-xs font-semibold text-white">
          Đăng nhập
        </Link>
      </div>
    )
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError(null)
    const { error } = await saveCurrentDesign(profile.id, name)
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    setName('')
  }

  return (
    <div className="absolute right-4 top-full z-20 mt-2 w-80 rounded-2xl border border-vibe-ink/10 bg-white p-4 shadow-vibe-lg">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên thiết kế…"
          className="w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
        />
        <button onClick={handleSave} disabled={saving} className="shrink-0 rounded-full bg-vibe-ink px-3.5 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto vibe-scrollbar">
        {savedDesigns.length === 0 && <p className="py-4 text-center text-xs text-vibe-ink-soft">Chưa có thiết kế nào được lưu.</p>}
        {savedDesigns.map((d) => (
          <div key={d.id} className="flex items-center gap-2 rounded-xl bg-vibe-cream/60 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-vibe-ink">{d.name}</p>
              <p className="text-[10px] text-vibe-ink-soft">{new Date(d.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <button
              onClick={() => {
                loadSavedDesign(d.id)
                onClose()
              }}
              title="Mở thiết kế"
              className="grid h-7 w-7 place-items-center rounded-full text-vibe-blue-dark hover:bg-white"
            >
              <FolderOpen size={14} />
            </button>
            <button onClick={() => deleteSavedDesign(d.id)} title="Xóa" className="grid h-7 w-7 place-items-center rounded-full text-red-500 hover:bg-white">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
