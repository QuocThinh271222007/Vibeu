import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { fetchSiteSettings, updateSiteSettings, type SiteSettings } from '@/lib/siteSettingsApi'
import { isCaptchaConfigured } from '@/lib/captcha'

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
