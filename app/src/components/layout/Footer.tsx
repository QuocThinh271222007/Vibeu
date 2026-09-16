import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MessageCircleQuestion } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { FacebookGlyph, InstagramGlyph, ThreadsGlyph } from '@/components/ui/SocialGlyphs'

const LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/studio', label: 'Nail studio' },
  { to: '/thu-vien', label: 'Thư viện mẫu' },
  { to: '/cong-dong', label: 'Cộng đồng' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'Về chúng tôi' },
]

const LEGAL_LINKS = [{ to: '/chinh-sach', label: 'Chính sách bảo mật' }]

const SOCIALS = [
  { href: 'https://www.instagram.com/vibe_u_art', icon: InstagramGlyph, label: 'Instagram' },
  { href: 'https://www.threads.com/@vibe_u_art', icon: ThreadsGlyph, label: 'Threads' },
  { href: 'https://www.facebook.com/profile.php?id=61593919006915', icon: FacebookGlyph, label: 'Facebook' },
]

// Same three real channels as SOCIALS/ContactSection, just as an icon+label list here
// instead of icon-only buttons.
const CONTACT_CHANNELS = [
  { icon: Mail, label: 'vibeu.nail.vn@gmail.com', href: 'mailto:vibeu.nail.vn@gmail.com' },
  { icon: FacebookGlyph, label: 'Vibeu Art', href: 'https://www.facebook.com/profile.php?id=61593919006915' },
  { icon: InstagramGlyph, label: '@vibe_u_art', href: 'https://www.instagram.com/vibe_u_art' },
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
          <ul className="mt-4 space-y-2.5">
            {CONTACT_CHANNELS.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={c.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                  className="flex items-center gap-2 text-sm text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark"
                >
                  <c.icon size={15} className="shrink-0" />
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            to="/about#gop-y"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-vibe-ink transition-colors hover:border-vibe-pink/40 hover:text-vibe-pink-dark"
          >
            <MessageCircleQuestion size={14} /> Gửi câu hỏi cho chúng tôi <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <div className="relative flex flex-col items-center gap-2 border-t border-vibe-ink/5 py-5 text-center text-xs text-vibe-ink-soft/70 sm:flex-row sm:justify-center sm:gap-4">
        <span>© {new Date().getFullYear()} VIBEU. Sáng tạo không giới hạn — Chính xác nhờ công nghệ.</span>
        <span className="hidden sm:inline">·</span>
        {LEGAL_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="font-medium text-vibe-ink-soft/80 transition-colors hover:text-vibe-pink-dark">
            {l.label}
          </Link>
        ))}
      </div>
    </footer>
  )
}
