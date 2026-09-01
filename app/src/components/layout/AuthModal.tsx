import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Lock, User, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDone(true)
    setTimeout(() => {
      onClose()
      setDone(false)
    }, 1400)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-vibe-ink/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-vibe-lg"
          >
            <div className="relative h-24 bg-[linear-gradient(120deg,#90B8EB,#FF92F9,#FFD879)] bg-[length:220%_220%]">
              <button
                onClick={onClose}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/30 text-white backdrop-blur transition hover:bg-white/50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-7 pb-8 pt-0">
              <div className="-mt-8 mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-vibe">
                <Sparkles className="text-vibe-pink-dark" size={28} />
              </div>

              {done ? (
                <div className="py-10 text-center">
                  <p className="font-display text-lg font-semibold text-vibe-ink">Chào mừng đến VIBEU!</p>
                  <p className="mt-2 text-sm text-vibe-ink-soft">Đây là bản demo giao diện — chưa kết nối hệ thống tài khoản thật.</p>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex gap-1 rounded-full bg-vibe-cream p-1">
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

                    <Button type="submit" className="mt-2 w-full">
                      {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                    </Button>
                    <p className="pt-1 text-center text-xs text-vibe-ink-soft">
                      Demo giao diện — chưa kết nối backend thật.
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
