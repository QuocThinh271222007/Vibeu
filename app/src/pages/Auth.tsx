import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Sparkles, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

const PERKS = [
  'Lưu lại các thiết kế móng yêu thích của bạn',
  'Mở khoá toàn bộ thư viện mẫu premium',
  'Đăng bài chia sẻ thiết kế lên Cộng đồng',
]

export default function Auth() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<'login' | 'register'>(params.get('tab') === 'register' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'signedIn' | 'confirmEmail' | null>(null)
  const navigate = useNavigate()
  const { signIn, signUp } = useAuthStore()
  const redirectTo = params.get('redirect') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Chưa cấu hình Supabase — thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào .env.local rồi tải lại trang.')
      return
    }
    setError(null)
    setSubmitting(true)
    if (tab === 'login') {
      const { error } = await signIn(email, password)
      setSubmitting(false)
      if (error) {
        setError(error)
        return
      }
      setDone('signedIn')
      setTimeout(() => navigate(redirectTo), 900)
    } else {
      const { error, needsEmailConfirmation } = await signUp(email, password, name)
      setSubmitting(false)
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
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
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

          <div className="rounded-[2rem] bg-white p-7 shadow-vibe-lg sm:p-8">
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
                  {done === 'confirmEmail' ? 'Kiểm tra email của bạn!' : 'Chào mừng đến VIBEU!'}
                </p>
                <p className="mt-2 text-sm text-vibe-ink-soft">
                  {done === 'confirmEmail'
                    ? 'Bấm vào liên kết xác nhận trong email vừa gửi để hoàn tất đăng ký.'
                    : 'Đang chuyển hướng...'}
                </p>
              </div>
            ) : (
              <>
                <p className="font-display text-2xl font-bold text-vibe-ink">
                  {tab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                </p>
                <p className="mt-1.5 text-sm text-vibe-ink-soft">
                  {tab === 'login' ? 'Đăng nhập để tiếp tục thiết kế nail của bạn.' : 'Chỉ mất chưa đầy một phút để bắt đầu.'}
                </p>

                <div className="mt-6 mb-5 flex gap-1 rounded-full bg-vibe-cream p-1">
                  {(['login', 'register'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTab(t)
                        setError(null)
                      }}
                      className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                        tab === t ? 'bg-white text-vibe-ink shadow-sm' : 'text-vibe-ink-soft'
                      }`}
                    >
                      {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
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

                  {error && (
                    <p className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
                    </p>
                  )}

                  {tab === 'login' && (
                    <div className="flex justify-end">
                      <button type="button" className="text-xs font-medium text-vibe-pink-dark hover:underline">
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}

                  <Button type="submit" disabled={submitting} className="mt-2 w-full">
                    {submitting ? 'Đang xử lý...' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  </Button>
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
