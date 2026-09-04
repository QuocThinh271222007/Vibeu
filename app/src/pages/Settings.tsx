import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, Camera, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { updateProfile, uploadAvatar } from '@/lib/profileApi'

const AVATAR_COLORS = ['#90B8EB', '#FF92F9', '#FFD879', '#8CCABD', '#B6A6E5', '#F4B094']

export default function Settings() {
  const { status, profile, signOut, updatePassword, refreshProfile } = useAuthStore()
  const { push } = useToast()

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [handle, setHandle] = useState(profile?.handle ?? '')
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor ?? AVATAR_COLORS[0])
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 text-center sm:px-6">
        <p className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle size={16} /> Chưa kết nối Supabase.
        </p>
      </div>
    )
  }

  if (status === 'loading') {
    return <div className="py-24 text-center text-sm text-vibe-ink-soft">Đang tải...</div>
  }

  if (status === 'signedOut' || !profile) {
    return <Navigate to="/auth?redirect=/settings" replace />
  }

  async function handleAvatarPick(file: File | null) {
    if (!file || !profile) return
    setUploadingAvatar(true)
    const { url, error } = await uploadAvatar(file, profile.id)
    if (error || !url) {
      setUploadingAvatar(false)
      push('error', error ?? 'Không tải lên được ảnh.')
      return
    }
    const { error: saveError } = await updateProfile(profile.id, { avatarUrl: url })
    setUploadingAvatar(false)
    if (saveError) {
      push('error', saveError)
      return
    }
    await refreshProfile()
    push('success', 'Đã cập nhật ảnh đại diện.')
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!displayName.trim()) {
      push('error', 'Tên hiển thị không được để trống.')
      return
    }
    setSavingProfile(true)
    const { error } = await updateProfile(profile.id, {
      displayName: displayName.trim(),
      handle: handle.trim() ? (handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`) : null,
      avatarColor,
    })
    setSavingProfile(false)
    if (error) {
      push('error', error)
      return
    }
    await refreshProfile()
    push('success', 'Đã lưu thông tin hồ sơ.')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu cần ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu nhập lại không khớp.')
      return
    }
    setSavingPassword(true)
    const { error } = await updatePassword(newPassword)
    setSavingPassword(false)
    if (error) {
      setPasswordError(error)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    push('success', 'Đã đổi mật khẩu.')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-vibe-ink">Cài đặt tài khoản</h1>
      <p className="mt-1.5 text-sm text-vibe-ink-soft">Quản lý hồ sơ và bảo mật tài khoản VIBEU của bạn.</p>

      <form onSubmit={handleSaveProfile} className="mt-8 rounded-[1.75rem] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]">
        <p className="font-display text-base font-semibold text-vibe-ink">Hồ sơ</p>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative">
            <Avatar name={displayName || profile.displayName} color={avatarColor} url={profile.avatarUrl} size={72} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-vibe-ink text-white shadow-sm disabled:opacity-60"
              aria-label="Đổi ảnh đại diện"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleAvatarPick(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-vibe-ink">{uploadingAvatar ? 'Đang tải ảnh lên...' : 'Ảnh đại diện'}</p>
            <p className="text-xs text-vibe-ink-soft">PNG/JPEG/WebP, tối đa 2MB. Không có ảnh sẽ dùng màu + chữ cái đầu bên dưới.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAvatarColor(c)}
              className={`h-8 w-8 rounded-full transition-transform ${avatarColor === c ? 'scale-110 ring-2 ring-vibe-ink ring-offset-2' : ''}`}
              style={{ background: c }}
              aria-label={`Chọn màu ${c}`}
            />
          ))}
        </div>

        <label className="mt-5 block text-xs font-medium text-vibe-ink-soft">Tên hiển thị</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border-2 border-vibe-ink/10 bg-vibe-cream/40 px-4 py-2.5 text-sm text-vibe-ink outline-none focus:border-vibe-pink/50"
        />

        <label className="mt-4 block text-xs font-medium text-vibe-ink-soft">Handle (hiện trên Cộng đồng)</label>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@ten-cua-ban"
          className="mt-1.5 w-full rounded-2xl border-2 border-vibe-ink/10 bg-vibe-cream/40 px-4 py-2.5 text-sm text-vibe-ink outline-none placeholder:text-vibe-ink-soft/50 focus:border-vibe-pink/50"
        />

        <label className="mt-4 block text-xs font-medium text-vibe-ink-soft">Email</label>
        <input
          value={profile.email ?? ''}
          disabled
          className="mt-1.5 w-full cursor-not-allowed rounded-2xl border-2 border-vibe-ink/5 bg-vibe-cream/70 px-4 py-2.5 text-sm text-vibe-ink-soft"
        />

        <div className="mt-5 flex justify-end">
          <Button type="submit" size="sm" disabled={savingProfile}>
            {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>

      <form onSubmit={handleChangePassword} className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]">
        <p className="font-display text-base font-semibold text-vibe-ink">Đổi mật khẩu</p>
        <label className="mt-4 block text-xs font-medium text-vibe-ink-soft">Mật khẩu mới</label>
        <input
          type="password"
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border-2 border-vibe-ink/10 bg-vibe-cream/40 px-4 py-2.5 text-sm text-vibe-ink outline-none focus:border-vibe-pink/50"
        />
        <label className="mt-4 block text-xs font-medium text-vibe-ink-soft">Nhập lại mật khẩu mới</label>
        <input
          type="password"
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border-2 border-vibe-ink/10 bg-vibe-cream/40 px-4 py-2.5 text-sm text-vibe-ink outline-none focus:border-vibe-pink/50"
        />
        {passwordError && (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {passwordError}
          </p>
        )}
        <div className="mt-5 flex justify-end">
          <Button type="submit" size="sm" disabled={savingPassword || !newPassword}>
            {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </Button>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between rounded-[1.75rem] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]">
        <div className="flex items-center gap-2 text-sm text-vibe-ink-soft">
          {profile.role === 'admin' && (
            <span className="flex items-center gap-1 rounded-full bg-vibe-pink/10 px-2.5 py-1 text-xs font-medium text-vibe-pink-dark">
              <ShieldCheck size={13} /> Tài khoản admin
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={() => signOut()}>
          <LogOut size={15} /> Đăng xuất
        </Button>
      </div>
    </div>
  )
}
