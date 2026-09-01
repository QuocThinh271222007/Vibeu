import { Link } from 'react-router-dom'
import { AtSign } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

function InstagramGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

const LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/studio', label: 'Nail studio' },
  { to: '/library', label: 'Thư viện mẫu' },
  { to: '/community', label: 'Cộng đồng' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'Về chúng tôi' },
]

const SOCIALS = [
  { href: 'https://www.instagram.com/vibe_u_art', icon: InstagramGlyph, label: 'Instagram' },
  { href: 'https://www.threads.com/@vibe_u_art', icon: AtSign, label: 'Threads' },
  { href: 'https://www.facebook.com/people/Vibeu-Art/61593942691951/', icon: FacebookGlyph, label: 'Facebook' },
]

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-vibe-ink/5 bg-white/70">
      <div className="pointer-events-none absolute -top-12 left-1/2 h-40 w-[140%] -translate-x-1/2 rounded-[100%] bg-[linear-gradient(90deg,#90B8EB33,#FF92F933,#FFD87933)] blur-2xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-vibe-ink-soft">
            Studio sáng tạo số giúp bạn tự thiết kế bộ nail mang đậm cá tính riêng — từ form, màu gel thạch đến charm 3D — rồi mang thẳng ra tiệm bằng mã QR, hoàn toàn miễn phí.
          </p>
          <div className="mt-5 flex gap-2.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="grid h-10 w-10 place-items-center rounded-full bg-vibe-cream text-vibe-ink transition-colors hover:bg-vibe-pink hover:text-white"
              >
                <s.icon />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-vibe-ink">Liên kết nhanh</p>
          <ul className="mt-4 space-y-2.5">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-vibe-ink">Chính sách &amp; Liên hệ</p>
          <ul className="mt-4 space-y-2.5 text-sm text-vibe-ink-soft">
            <li>Chính sách bảo mật (demo)</li>
            <li>Điều khoản sử dụng (demo)</li>
            <li className="pt-1">
              <span className="block text-vibe-ink-soft/70">Bản demo giao diện — chưa có backend.</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-vibe-ink/5 py-5 text-center text-xs text-vibe-ink-soft/70">
        © {new Date().getFullYear()} VIBEU. Sáng tạo không giới hạn — Chính xác nhờ công nghệ.
      </div>
    </footer>
  )
}
