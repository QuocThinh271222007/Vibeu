import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Sparkles, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Captcha } from '@/components/ui/Captcha'
import { PageMeta } from '@/components/seo/PageMeta'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { isCaptchaConfigured } from '@/lib/captcha'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const PERKS = [
  'Lưu lại các thiết kế móng yêu thích của bạn',
  'Mở khoá toàn bộ thư viện mẫu premium',
  'Đăng bài chia sẻ thiết kế lên Cộng đồng',
]

type Tab = 'login' | 'register' | 'forgot'
type Done = 'signedIn' | 'confirmEmail' | 'resetSent'

export default function Auth() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'register' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const navigate = useNavigate()
  const { signIn, signUp, resendConfirmation, requestPasswordReset } = useAuthStore()
  const settings = useSiteSettings()
  const redirectTo = params.get('redirect') || '/'

  const captchaRequired = isCaptchaConfigured && settings?.requireCaptcha === true
  const registrationClosed = settings?.registrationOpen === false

  function resetCaptcha() {
    setCaptchaToken(null)
    setCaptchaResetKey((k) => k + 1)
  }

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    resetCaptcha()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Chưa cấu hình Supabase — thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào .env.local rồi tải lại trang.')
      return
    }
    if (captchaRequired && !captchaToken) {
      setError('Vui lòng hoàn tất xác minh captcha.')
      return
    }
    setError(null)
    setSubmitting(true)

    if (tab === 'forgot') {
      const { error } = await requestPasswordReset(email, captchaToken)
      setSubmitting(false)
      resetCaptcha()
      if (error) {
        setError(error)
        return
      }
      setDone('resetSent')
      return
    }

    if (tab === 'login') {
      const { error } = await signIn(email, password, captchaToken)
      setSubmitting(false)
      resetCaptcha()
      if (error) {
        setError(error)
        return
      }
      setDone('signedIn')
      setTimeout(() => navigate(redirectTo), 900)
      return
    }

    if (registrationClosed) {
      setSubmitting(false)
      setError('Đăng ký tài khoản mới đang tạm khoá.')
      return
    }

    const { error, needsEmailConfirmation } = await signUp(email, password, name, captchaToken)
    setSubmitting(false)
    resetCaptcha()
    if (error) {
      setError(error)
      return
    }
    if (needsEmailConfirmation) {
      setDone('confirmEmail')
    } else {
      setDone('signedIn')
      setTimeout(() => navigate(redirectTo), 900)
    }
  }

  async function handleResend() {
    setResending(true)
    const { error } = await resendConfirmation(email)
    setResending(false)
    if (!error) setResendSent(true)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <PageMeta title="Đăng nhập" description="Đăng nhập hoặc tạo tài khoản VIBEU." canonicalPath="/auth" noindex />
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#90B8EB,#FF92F9_55%,#FFD879)] p-10 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/15 blur-3xl" />

        <div className="relative w-fit rounded-2xl bg-white/90 p-2 shadow-vibe backdrop-blur">
          <Logo />
        </div>

        <div className="relative">
          <p className="font-display text-4xl font-bold leading-tight text-white drop-shadow-sm">
            Nail xinh,
            <br />
            Vibe mình.
          </p>
          <p className="mt-4 max-w-sm text-sm text-white/90">
            Tham gia VIBEU để tự thiết kế bộ móng trong mơ, lưu lại thiết kế và khám phá hàng trăm mẫu nail được tuyển chọn.
          </p>
          <ul className="mt-6 space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm font-medium text-white">
                <CheckCircle2 size={18} className="shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/70">© {new Date().getFullYear()} VIBEU. Đã đăng ký bản quyền.</p>
      </div>

      <div className="flex items-center justify-center bg-vibe-cream px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft hover:text-vibe-ink">
              <ArrowLeft size={16} /> Về trang chủ
            </Link>
            <Logo />
          </div>

          <div className="rounded-[2rem] bg-vibe-highlight p-7 shadow-vibe-lg sm:p-8">
            {!isSupabaseConfigured && (
              <div className="mb-5 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                Chưa kết nối Supabase — đăng nhập/đăng ký tạm thời chưa hoạt động. Xem <code>.env.example</code>.
              </div>
            )}

            {done ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-vibe-pink/10">
                  <Sparkles className="text-vibe-pink-dark" size={28} />
                </div>
                <p className="font-display text-lg font-semibold text-vibe-ink">
                  {done === 'confirmEmail' ? 'Kiểm tra email của bạn!' : done === 'resetSent' ? 'Đã gửi email!' : 'Chào mừng đến VIBEU!'}
                </p>
                <p className="mt-2 text-sm text-vibe-ink-soft">
                  {done === 'confirmEmail'
                    ? 'Bấm vào liên kết xác nhận trong email vừa gửi để hoàn tất đăng ký.'
                    : done === 'resetSent'
                      ? 'Nếu email này đã đăng ký, một liên kết đặt lại mật khẩu vừa được gửi tới đó.'
                      : 'Đang chuyển hướng...'}
                </p>
                {done === 'confirmEmail' && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || resendSent}
                    className="mt-4 text-sm font-semibold text-vibe-pink-dark hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                  >
                    {resendSent ? 'Đã gửi lại email xác nhận' : resending ? 'Đang gửi...' : 'Chưa nhận được? Gửi lại email xác nhận'}
                  </button>
                )}
                {done === 'resetSent' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDone(null)
                      switchTab('login')
                    }}
                    className="mt-4 text-sm font-semibold text-vibe-pink-dark hover:underline"
                  >
                    ← Quay lại đăng nhập
                  </button>
                )}
              </div>
            ) : (
              <>
                {settings?.maintenanceMode && (
                  <div className="mb-5 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {settings.maintenanceMessage}
                  </div>
                )}

                <p className="font-display text-2xl font-bold text-vibe-ink">
                  {tab === 'login' ? 'Chào mừng trở lại' : tab === 'register' ? 'Tạo tài khoản mới' : 'Quên mật khẩu?'}
                </p>
                <p className="mt-1.5 text-sm text-vibe-ink-soft">
                  {tab === 'login'
                    ? 'Đăng nhập để tiếp tục thiết kế nail của bạn.'
                    : tab === 'register'
                      ? 'Chỉ mất chưa đầy một phút để bắt đầu.'
                      : 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.'}
                </p>

                {tab !== 'forgot' && (
                  <div className="mt-6 mb-5 flex gap-1 rounded-full bg-vibe-cream p-1">
                    {(['login', 'register'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => switchTab(t)}
                        className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                          tab === t ? 'bg-white text-vibe-ink shadow-sm' : 'text-vibe-ink-soft'
                        }`}
                      >
                        {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                      </button>
                    ))}
                  </div>
                )}

                {tab === 'register' && registrationClosed && (
                  <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> Đăng ký tài khoản mới đang tạm khoá.
                  </p>
                )}

                <form onSubmit={handleSubmit} className={`space-y-3 ${tab === 'forgot' ? 'mt-5' : ''}`}>
                  {tab === 'register' && (
                    <label className="flex items-center gap-2.5 rounded-2xl border-2 border-vibe-ink/10 px-4 py-3 focus-within:border-vibe-pink/50">
                      <User size={18} className="text-vibe-ink-soft" />
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tên của bạn"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-2.5 rounded-2xl border-2 border-vibe-ink/10 px-4 py-3 focus-within:border-vibe-pink/50">
                    <Mail size={18} className="text-vibe-ink-soft" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
                    />
                  </label>
                  {tab !== 'forgot' && (
                    <label className="flex items-center gap-2.5 rounded-2xl border-2 border-vibe-ink/10 px-4 py-3 focus-within:border-vibe-pink/50">
                      <Lock size={18} className="text-vibe-ink-soft" />
                      <input
                        required
                        type="password"
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mật khẩu"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
                      />
                    </label>
                  )}

                  {isCaptchaConfigured && <Captcha onToken={setCaptchaToken} resetKey={captchaResetKey} />}

                  {error && (
                    <p className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
                    </p>
                  )}

                  {tab === 'login' && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => switchTab('forgot')} className="text-xs font-medium text-vibe-pink-dark hover:underline">
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}

                  <Button type="submit" disabled={submitting || (tab === 'register' && registrationClosed)} className="mt-2 w-full">
                    {submitting
                      ? 'Đang xử lý...'
                      : tab === 'login'
                        ? 'Đăng nhập'
                        : tab === 'register'
                          ? 'Tạo tài khoản'
                          : 'Gửi liên kết đặt lại'}
                  </Button>

                  {tab === 'forgot' && (
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-vibe-ink-soft hover:text-vibe-ink"
                    >
                      <ArrowLeft size={13} /> Quay lại đăng nhập
                    </button>
                  )}
                </form>
              </>
            )}
          </div>

          <p className="mt-6 hidden text-center text-xs text-vibe-ink-soft lg:block">
            <Link to="/" className="font-medium text-vibe-ink hover:underline">
              ← Về trang chủ
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
