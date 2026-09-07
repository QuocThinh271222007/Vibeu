import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

/**
 * Reached from the "reset password" email link. supabase-js auto-parses the recovery token from
 * the URL when the client is created (detectSessionInUrl defaults to true) and fires a
 * PASSWORD_RECOVERY auth event once the recovery session is live — this page just waits for
 * that, then lets the user set a new password via updateUser({ password }).
 */
export default function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const { updatePassword } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) {
      setChecked(true)
      return
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      setChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Mật khẩu cần ít nhất 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }
    setError(null)
    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/'), 1600)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-vibe-cream px-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-vibe-highlight p-8 shadow-vibe-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {!isSupabaseConfigured ? (
          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            Chưa kết nối Supabase.
          </p>
        ) : done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-vibe-pink/10">
              <CheckCircle2 className="text-vibe-pink-dark" size={26} />
            </div>
            <p className="font-display text-lg font-semibold text-vibe-ink">Đã đổi mật khẩu!</p>
            <p className="mt-2 text-sm text-vibe-ink-soft">Đang chuyển về trang chủ...</p>
          </div>
        ) : !checked ? (
          <p className="py-6 text-center text-sm text-vibe-ink-soft">Đang xác thực liên kết...</p>
        ) : !ready ? (
          <div className="py-4 text-center">
            <p className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-left text-xs text-red-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </p>
            <Link to="/auth" className="mt-4 inline-block text-sm font-semibold text-vibe-pink-dark hover:underline">
              ← Quay lại đăng nhập để gửi yêu cầu mới
            </Link>
          </div>
        ) : (
          <>
            <p className="font-display text-xl font-bold text-vibe-ink">Đặt lại mật khẩu</p>
            <p className="mt-1.5 text-sm text-vibe-ink-soft">Nhập mật khẩu mới cho tài khoản của bạn.</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <label className="flex items-center gap-2.5 rounded-2xl border-2 border-vibe-ink/10 px-4 py-3 focus-within:border-vibe-pink/50">
                <Lock size={18} className="text-vibe-ink-soft" />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
                />
              </label>
              <label className="flex items-center gap-2.5 rounded-2xl border-2 border-vibe-ink/10 px-4 py-3 focus-within:border-vibe-pink/50">
                <Lock size={18} className="text-vibe-ink-soft" />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
                />
              </label>

              {error && (
                <p className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="mt-1 w-full">
                {submitting ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
