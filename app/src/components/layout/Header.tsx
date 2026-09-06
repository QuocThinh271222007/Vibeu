import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LibraryBig, LogOut, Menu, Settings, Shield, User, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { to: '/', label: 'Trang chủ' },
  { to: '/studio', label: 'Nail studio' },
  { to: '/library', label: 'Thư viện mẫu' },
  { to: '/community', label: 'Cộng đồng' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'Về chúng tôi' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const navigate = useNavigate()
  const { status, profile, signOut } = useAuthStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 shadow-[0_8px_24px_-16px_rgba(80,50,120,0.35)] backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-vibe-ink text-white' : 'text-vibe-ink-soft hover:bg-white hover:text-vibe-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {status === 'signedIn' && profile ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-semibold text-vibe-ink shadow-sm"
                >
                  <Avatar name={profile.displayName} color={profile.avatarColor} url={profile.avatarUrl} size={32} />
                  {profile.displayName}
                </button>
                <AnimatePresence>
                  {accountOpen && (
                    <>
                      <div className="fixed inset-0 z-[95]" onClick={() => setAccountOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+8px)] z-[96] w-48 overflow-hidden rounded-2xl bg-white p-1.5 shadow-vibe-lg"
                      >
                        {profile.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-vibe-ink hover:bg-vibe-cream"
                          >
                            <Shield size={16} /> Trang quản trị
                          </Link>
                        )}
                        <Link
                          to={`/u/${profile.id}?tab=collection`}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-vibe-ink hover:bg-vibe-cream"
                        >
                          <LibraryBig size={16} /> Bộ sưu tập
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-vibe-ink hover:bg-vibe-cream"
                        >
                          <Settings size={16} /> Cài đặt tài khoản
                        </Link>
                        <button
                          onClick={() => {
                            setAccountOpen(false)
                            signOut()
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-vibe-ink hover:bg-vibe-cream"
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/auth')}>
                <User size={16} /> Đăng nhập
              </Button>
            )}
            <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/studio')}>
              Bắt đầu thiết kế
            </Button>
            <button
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-vibe-ink shadow-sm lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[90] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-vibe-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-vibe-cream p-6 shadow-vibe-lg"
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl px-4 py-3 font-display font-medium text-vibe-ink hover:bg-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2">
                {status === 'signedIn' && profile ? (
                  <>
                    {profile.role === 'admin' && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setMobileOpen(false)
                          navigate('/admin')
                        }}
                      >
                        <Shield size={16} /> Trang quản trị
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setMobileOpen(false)
                        navigate(`/u/${profile.id}?tab=collection`)
                      }}
                    >
                      <LibraryBig size={16} /> Bộ sưu tập
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setMobileOpen(false)
                        navigate('/settings')
                      }}
                    >
                      <Settings size={16} /> Cài đặt tài khoản
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setMobileOpen(false)
                        signOut()
                      }}
                    >
                      <LogOut size={16} /> Đăng xuất ({profile.displayName})
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setMobileOpen(false)
                      navigate('/auth')
                    }}
                  >
                    Đăng nhập / Đăng ký
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setMobileOpen(false)
                    navigate('/studio')
                  }}
                >
                  Bắt đầu thiết kế ngay
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
