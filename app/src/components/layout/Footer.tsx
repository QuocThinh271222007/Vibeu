import { Link } from 'react-router-dom'
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

/** The actual Threads brand mark — path verified against simple-icons' published
 * Threads glyph (raw.githubusercontent.com/simple-icons/simple-icons), not a generic
 * lucide AtSign standing in for it. Rendered as a solid fill (like the real mark) rather
 * than forced into the stroke style of the other two, which aren't wordmark glyphs. */
function ThreadsGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" />
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
  { href: 'https://www.threads.com/@vibe_u_art', icon: ThreadsGlyph, label: 'Threads' },
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
