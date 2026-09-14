import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { FacebookGlyph, InstagramGlyph } from '@/components/ui/SocialGlyphs'
import { submitFeedback } from '@/lib/feedbackApi'
import { useAuthStore } from '@/store/authStore'

const CHANNELS = [
  {
    icon: Mail,
    label: 'Email hỗ trợ',
    value: 'vibeu.nail.vn@gmail.com',
    href: 'mailto:vibeu.nail.vn@gmail.com',
  },
  {
    icon: FacebookGlyph,
    label: 'Facebook Fanpage',
    value: 'Vibeu Art (Fanpage Official)',
    href: 'https://www.facebook.com/profile.php?id=61593919006915',
  },
  {
    icon: InstagramGlyph,
    label: 'Instagram',
    value: '@vibe_u_art (Kênh Instagram)',
    href: 'https://www.instagram.com/vibe_u_art',
  },
]

/** Two-card "Liên hệ" section on the Về chúng tôi page: static support channels on the left,
 * a real feedback form (backed by site_feedback in Supabase) on the right. */
export function ContactSection() {
  const profile = useAuthStore((s) => s.profile)
  const { push } = useToast()
  const [name, setName] = useState(profile?.displayName ?? '')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      push('error', 'Điền tên và ý kiến của bạn trước đã nhé.')
      return
    }
    setSubmitting(true)
    const { error } = await submitFeedback(name.trim(), message.trim(), profile?.id ?? null)
    setSubmitting(false)
    if (error) {
      push('error', error)
      return
    }
    setMessage('')
    push('success', 'Đã gửi ý kiến — cảm ơn bạn đã góp ý cho VIBEU!')
  }

  return (
    <section className="mx-auto mt-16 grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-[1.75rem] bg-vibe-highlight p-7 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]"
      >
        <span className="inline-flex items-center rounded-full bg-vibe-blue/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vibe-blue-dark">
          Kênh hỗ trợ
        </span>
        <h3 className="mt-3 font-display text-xl font-semibold text-vibe-ink">Liên hệ với VIBEU</h3>
        <ul className="mt-5 space-y-4">
          {CHANNELS.map((c) => (
            <li key={c.label} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-vibe-blue text-white">
                <c.icon size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-vibe-ink-soft">{c.label}</p>
                <a href={c.href} target="_blank" rel="noreferrer" className="truncate text-sm font-semibold text-vibe-ink hover:text-vibe-pink-dark">
                  {c.value}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        id="gop-y"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        // scroll-mt clears the sticky header when the footer's "Gửi câu hỏi cho chúng tôi"
        // link jumps straight here via #gop-y (see ScrollToTop in App.tsx).
        className="scroll-mt-28 rounded-[1.75rem] bg-vibe-highlight p-7 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]"
      >
        <span className="inline-flex items-center rounded-full bg-vibe-yellow/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vibe-yellow-dark">
          Góp ý dự án
        </span>
        <h3 className="mt-3 font-display text-xl font-semibold text-vibe-ink">Gửi ý kiến cho chúng tôi</h3>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên của bạn..."
            className="w-full rounded-2xl border-2 border-vibe-ink/10 bg-white px-4 py-2.5 text-sm text-vibe-ink outline-none placeholder:text-vibe-ink-soft/60 focus:border-vibe-pink/50"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ý kiến hoặc tính năng bạn muốn VIBEU phát triển thêm..."
            rows={4}
            className="w-full resize-none rounded-2xl border-2 border-vibe-ink/10 bg-white px-4 py-2.5 text-sm text-vibe-ink outline-none placeholder:text-vibe-ink-soft/60 focus:border-vibe-pink/50"
          />
          <Button type="submit" size="md" disabled={submitting} className="w-full">
            <Send size={16} /> {submitting ? 'Đang gửi...' : 'Gửi ý kiến ngay'}
          </Button>
        </form>
      </motion.div>
    </section>
  )
}
