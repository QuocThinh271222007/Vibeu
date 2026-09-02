import { motion } from 'framer-motion'
import { Heart, Palette, QrCode } from 'lucide-react'

const CARDS = [
  {
    icon: Palette,
    title: 'Tự chọn form móng',
    desc: 'Tự chọn form móng, màu gel thạch, hiệu ứng mắt mèo và đính 30+ mẫu charm cực gu.',
    bg: 'bg-[linear-gradient(160deg,#EAF2FF,#DCE9FB)]',
    iconColor: 'text-vibe-blue-dark',
  },
  {
    icon: QrCode,
    title: 'Tự do tải & xuất mã QR',
    desc: 'Không phát sinh chi phí ẩn, xuất công thức HD và quét mã QR mang ra tiệm hoàn toàn miễn phí.',
    bg: 'bg-[linear-gradient(160deg,#FFF3D8,#FFE9BB)]',
    iconColor: 'text-vibe-yellow-dark',
  },
  {
    icon: Heart,
    title: 'Phù hợp mọi nhu cầu',
    desc: 'Đi tiệc, kỷ niệm, đi học hay đơn giản là muốn làm mới bộ móng mang dấu ấn cá nhân.',
    bg: 'bg-[linear-gradient(160deg,#FFE9FB,#FFD9F7)]',
    iconColor: 'text-vibe-pink-dark',
  },
]

export function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Vì sao chọn chúng tôi" title="Sáng tạo theo cách của riêng bạn" />
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className={`rounded-[2rem] p-10 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] ${c.bg}`}
          >
            <span className={`grid h-16 w-16 place-items-center rounded-2xl bg-white/70 ${c.iconColor}`}>
              <c.icon size={32} strokeWidth={2} />
            </span>
            <h3 className="mt-5 font-display text-2xl font-semibold text-vibe-ink">{c.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-vibe-ink-soft">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function SectionHeading({ eyebrow, title, center = false }: { eyebrow: string; title: string; center?: boolean }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">{title}</h2>
    </div>
  )
}
