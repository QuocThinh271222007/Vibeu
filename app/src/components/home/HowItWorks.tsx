import { motion } from 'framer-motion'
import { MousePointerClick, QrCode, Wand2 } from 'lucide-react'
import { SectionHeading } from '@/components/home/WhyUs'

const STEPS = [
  {
    icon: Wand2,
    title: 'Sáng tạo gu móng riêng',
    desc: 'Tự do chọn dáng móng, phối màu gel thạch và đính charm chuẩn thần thái cá nhân.',
  },
  {
    icon: MousePointerClick,
    title: 'Phối cảnh trực tiếp trên Canvas Studio',
    desc: 'Thao tác kéo - thả mượt mà trên bàn tay mô phỏng ngay tại website — không cần tải app, không cài đặt rườm rà.',
  },
  {
    icon: QrCode,
    title: 'Tải công thức & Mã QR mang ra tiệm',
    desc: 'Lưu ngay bản thông số kỹ thuật sắc nét (HD) hoặc quét mã QR để xem công thức chuẩn.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Cách hoạt động" title="Chỉ 3 bước, mang thần thái ra tiệm" center />

        <div className="relative mt-14 grid gap-8 sm:grid-cols-3">
          <div className="absolute left-[16.6%] right-[16.6%] top-9 hidden h-0.5 bg-[repeating-linear-gradient(90deg,#e6dcf5,#e6dcf5_8px,transparent_8px,transparent_16px)] sm:block" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="relative z-10 mx-auto grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-[linear-gradient(135deg,#90B8EB,#FF92F9)] text-white shadow-vibe">
                <s.icon size={26} />
              </div>
              <span className="mt-4 inline-block font-display text-xs font-bold text-vibe-pink-dark">BƯỚC {i + 1}</span>
              <h3 className="mt-1 font-display text-lg font-semibold text-vibe-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-vibe-ink-soft">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
