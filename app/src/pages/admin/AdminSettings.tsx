import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Shuffle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { fetchSiteSettings, updateSiteSettings, type SiteSettings } from '@/lib/siteSettingsApi'
import { isCaptchaConfigured } from '@/lib/captcha'
import { TemplatePreviewMedia } from '@/components/studio/TemplatePreviewMedia'
import { useTemplates } from '@/data/loaders'
import { HOMEPAGE_SHOWCASE_SLOT_COUNT, resolveHomepageShowcase } from '@/lib/homepageShowcase'
import type { Template } from '@/types/vibeu'

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-vibe-ink">{label}</span>
        <span className="block text-xs text-vibe-ink-soft">{hint}</span>
      </span>
      <span
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-vibe-ink' : 'bg-vibe-ink/15'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </span>
    </label>
  )
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 size={15} className="text-emerald-600" /> : <XCircle size={15} className="text-vibe-ink-soft/50" />}
      <span className={ok ? 'text-vibe-ink' : 'text-vibe-ink-soft'}>{label}</span>
    </div>
  )
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const { push } = useToast()

  useEffect(() => {
    fetchSiteSettings().then(setSettings)
  }, [])

  async function save(patch: Partial<SiteSettings>) {
    if (!settings) return
    const next = { ...settings, ...patch }
    setSettings(next)
    setSaving(true)
    const { error } = await updateSiteSettings(patch)
    setSaving(false)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã lưu cài đặt.')
  }

  if (!settings) {
    return <div className="py-16 text-center text-sm text-vibe-ink-soft">Đang tải...</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Cài đặt hệ thống</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">Các công tắc này áp dụng ngay lập tức cho toàn bộ người dùng.</p>

      <div className="mt-6 divide-y divide-vibe-ink/5 rounded-2xl bg-white p-5 shadow-sm">
        <Toggle
          checked={settings.registrationOpen}
          onChange={(v) => save({ registrationOpen: v })}
          label="Cho phép đăng ký tài khoản mới"
          hint="Tắt để tạm khoá nút Đăng ký trên trang /auth (đăng nhập vẫn hoạt động bình thường)."
        />
        <Toggle
          checked={settings.maintenanceMode}
          onChange={(v) => save({ maintenanceMode: v })}
          label="Chế độ bảo trì"
          hint="Bật để khách (không phải admin) thấy thông báo bảo trì thay vì nội dung trang. Admin vẫn xem/sửa được bình thường."
        />
        <Toggle
          checked={settings.requireCaptcha}
          onChange={(v) => save({ requireCaptcha: v })}
          label="Bắt buộc captcha khi đăng nhập/đăng ký"
          hint="Chỉ có tác dụng khi đã cấu hình Turnstile (xem trạng thái bên dưới). Tắt thì captcha vẫn hiện nhưng không bắt buộc."
        />
        <Toggle
          checked={settings.communityModeration}
          onChange={(v) => save({ communityModeration: v })}
          label="Duyệt bài Cộng đồng trước khi công khai"
          hint="Bật (mặc định): bài mới chỉ tác giả thấy cho tới khi admin duyệt ở mục Cộng đồng. Tắt: bài đăng công khai ngay (vẫn có rate-limit chống spam)."
        />
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
        <HomepageShowcaseEditor
          templateIds={settings.homepageShowcaseTemplateIds}
          onSave={(ids) => save({ homepageShowcaseTemplateIds: ids })}
        />
      </div>

      {settings.maintenanceMode && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <label className="block text-xs font-medium text-vibe-ink-soft">Thông báo hiển thị khi bảo trì</label>
          <textarea
            value={settings.maintenanceMessage}
            onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
            rows={2}
            className="mt-1.5 w-full resize-none rounded-2xl border-2 border-vibe-ink/10 bg-vibe-cream/40 px-4 py-2.5 text-sm text-vibe-ink outline-none focus:border-vibe-pink/50"
          />
          <div className="mt-3 flex justify-end">
            <Button size="sm" disabled={saving} onClick={() => save({ maintenanceMessage: settings.maintenanceMessage })}>
              {saving ? 'Đang lưu...' : 'Lưu thông báo'}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-display text-sm font-semibold text-vibe-ink">Trạng thái backend</p>
        <div className="mt-3 space-y-2">
          <StatusRow ok={isCaptchaConfigured} label="Turnstile site key đã cấu hình (VITE_TURNSTILE_SITE_KEY)" />
        </div>
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-vibe-cream/60 px-3 py-2 text-xs text-vibe-ink-soft">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          Rate limit chống spam (đăng bài/thích/lưu công thức) và bảo vệ email xác thực/đặt lại mật khẩu chạy ở tầng Supabase, không cần bật gì thêm ở đây — xem mục "Bảo mật &amp; chống spam" trong README.
        </p>
      </div>
    </div>
  )
}

/** 3 thẻ mẫu trôi nổi cạnh tiêu đề trang chủ (src/components/home/Hero.tsx). Mỗi ô chọn một mẫu
 * độc lập; nếu một mẫu đã chọn bị xoá khỏi thư viện, Hero.tsx tự thay bằng mẫu khác ngay khi
 * hiển thị — người dùng cuối không bao giờ thấy thẻ trống, admin chỉ cần vào đây đổi lại khi rảnh. */
function HomepageShowcaseEditor({ templateIds, onSave }: { templateIds: string[]; onSave: (ids: string[]) => void }) {
  const { templates } = useTemplates()
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  // Same resolution Hero.tsx uses for the real homepage — so a slot whose configured id was
  // deleted shows the actual backfilled template here too, never a stale "mẫu đã bị xoá" for
  // something visitors already see replaced.
  const resolved = resolveHomepageShowcase(templates, templateIds)
  const slots = resolved.map((t) => t.id)

  function assign(slot: number, templateId: string) {
    const next = [...slots]
    next[slot] = templateId
    onSave(next)
    setPickerSlot(null)
  }

  function shuffleAll() {
    const shuffled = [...templates].sort(() => Math.random() - 0.5)
    const next = shuffled.slice(0, HOMEPAGE_SHOWCASE_SLOT_COUNT).map((t) => t.id)
    if (next.length === HOMEPAGE_SHOWCASE_SLOT_COUNT) onSave(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-vibe-ink">Thẻ mẫu trôi nổi trên trang chủ</p>
          <p className="mt-0.5 text-xs text-vibe-ink-soft">
            3 thẻ hiển thị cạnh tiêu đề trang chủ. Xoá mẫu khỏi thư viện thì thẻ tương ứng tự đổi sang mẫu khác, không bao giờ để trống.
          </p>
        </div>
        <button
          onClick={shuffleAll}
          disabled={templates.length < HOMEPAGE_SHOWCASE_SLOT_COUNT}
          title="Chọn ngẫu nhiên 3 mẫu"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-vibe-cream px-3 py-1.5 text-xs font-semibold text-vibe-ink-soft hover:bg-vibe-ink hover:text-white disabled:opacity-40"
        >
          <Shuffle size={13} /> Ngẫu nhiên
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {Array.from({ length: HOMEPAGE_SHOWCASE_SLOT_COUNT }, (_, i) => {
          // resolveHomepageShowcase already dropped any unresolvable id and backfilled from the
          // library — the only way a slot has no template is the library itself being empty.
          const t = resolved[i]
          return (
            <div key={i} className="overflow-hidden rounded-xl border-2 border-vibe-ink/10">
              <div className="aspect-[2/3] bg-vibe-cream">
                {t ? (
                  <TemplatePreviewMedia template={t} className="h-full w-full" />
                ) : (
                  <div className="grid h-full place-items-center px-2 text-center text-[10px] text-vibe-ink-soft">Thư viện chưa có mẫu nào</div>
                )}
              </div>
              <button onClick={() => setPickerSlot(i)} className="w-full py-1.5 text-[11px] font-semibold text-vibe-pink-dark hover:bg-vibe-cream">
                Đổi mẫu
              </button>
            </div>
          )
        })}
      </div>

      {pickerSlot !== null && (
        <TemplatePickerModal templates={templates} onPick={(id) => assign(pickerSlot, id)} onClose={() => setPickerSlot(null)} />
      )}
    </div>
  )
}

function TemplatePickerModal({ templates, onPick, onClose }: { templates: Template[]; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-vibe-lg" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 font-display text-base font-semibold text-vibe-ink">Chọn mẫu cho thẻ này</p>
        {templates.length === 0 ? (
          <p className="text-sm text-vibe-ink-soft">Chưa có mẫu nào trong thư viện.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {templates.map((t) => (
              <button key={t.id} onClick={() => onPick(t.id)} className="overflow-hidden rounded-xl border-2 border-transparent text-left hover:border-vibe-pink">
                <div className="aspect-[2/3]">
                  <TemplatePreviewMedia template={t} className="h-full w-full" />
                </div>
                <p className="truncate px-1 py-1 text-[11px] font-medium text-vibe-ink">{t.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
