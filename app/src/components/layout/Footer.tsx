import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { FacebookGlyph, InstagramGlyph, ThreadsGlyph } from '@/components/ui/SocialGlyphs'

const LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/studio', label: 'Nail studio' },
  { to: '/library', label: 'Thư viện mẫu' },
  { to: '/community', label: 'Cộng đồng' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'Về chúng tôi' },
]

const LEGAL_LINKS = [{ to: '/chinh-sach', label: 'Chính sách bảo mật' }]

const SOCIALS = [
  { href: 'https://www.instagram.com/vibe_u_art', icon: InstagramGlyph, label: 'Instagram' },
  { href: 'https://www.threads.com/@vibe_u_art', icon: ThreadsGlyph, label: 'Threads' },
  { href: 'https://www.facebook.com/people/Vibeu-Art/61593942691951/', icon: FacebookGlyph, label: 'Facebook' },
]

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-vibe-ink/5 bg-vibe-highlight">
      <div className="pointer-events-none absolute -top-12 left-1/2 h-40 w-[140%] -translate-x-1/2 rounded-[100%] bg-[linear-gradient(90deg,#90B8EB33,#FF92F933,#FFD87933)] blur-2xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <Logo full />
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
          <p className="font-display text-sm font-semibold text-vibe-ink">Liên hệ</p>
          <ul className="mt-4 space-y-2.5 text-sm text-vibe-ink-soft">
            <li>
              <Link to="/about" className="transition-colors hover:text-vibe-pink-dark">
                Về chúng tôi
              </Link>
            </li>
            <li>Nhắn tin qua Instagram/Facebook/Threads ở bên cạnh để được hỗ trợ.</li>
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-vibe-pink-dark">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-vibe-ink/5 py-5 text-center text-xs text-vibe-ink-soft/70">
        © {new Date().getFullYear()} VIBEU. Sáng tạo không giới hạn — Chính xác nhờ công nghệ.
      </div>
    </footer>
  )
}
