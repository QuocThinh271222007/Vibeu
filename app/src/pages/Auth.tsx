import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

const PERKS = [
  'Lưu lại các thiết kế móng yêu thích của bạn',
  'Mở khoá toàn bộ thư viện mẫu premium',
  'Đồng bộ studio trên mọi thiết bị',
]

export default function Auth() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<'login' | 'register'>(params.get('tab') === 'register' ? 'register' : 'login')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDone(true)
    setTimeout(() => navigate('/'), 1400)
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
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft hover:text-vibe-ink lg:hidden">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>

          <div className="mb-6 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-vibe-lg sm:p-8">
            {done ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-vibe-pink/10">
                  <Sparkles className="text-vibe-pink-dark" size={28} />
                </div>
                <p className="font-display text-lg font-semibold text-vibe-ink">Chào mừng đến VIBEU!</p>
                <p className="mt-2 text-sm text-vibe-ink-soft">Đây là bản demo giao diện — chưa kết nối hệ thống tài khoản thật.</p>
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
                      onClick={() => setTab(t)}
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
                      <input required placeholder="Tên của bạn" className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60" />
                    </label>
                  )}
                  <label className="flex items-center gap-2.5 rounded-2xl border-2 border-vibe-ink/10 px-4 py-3 focus-within:border-vibe-pink/50">
                    <Mail size={18} className="text-vibe-ink-soft" />
                    <input required type="email" placeholder="Email" className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60" />
                  </label>
                  <label className="flex items-center gap-2.5 rounded-2xl border-2 border-vibe-ink/10 px-4 py-3 focus-within:border-vibe-pink/50">
                    <Lock size={18} className="text-vibe-ink-soft" />
                    <input required type="password" placeholder="Mật khẩu" className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60" />
                  </label>

                  {tab === 'login' && (
                    <div className="flex justify-end">
                      <button type="button" className="text-xs font-medium text-vibe-pink-dark hover:underline">
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}

                  <Button type="submit" className="mt-2 w-full">
                    {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  </Button>
                  <p className="pt-1 text-center text-xs text-vibe-ink-soft">Demo giao diện — chưa kết nối backend thật.</p>
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
