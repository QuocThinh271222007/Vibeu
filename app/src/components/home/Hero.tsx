import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TemplatePreviewMedia } from '@/components/studio/TemplatePreviewMedia'
import { useDecals } from '@/data/loaders'
import { findTemplate } from '@/data/templates'

const SHOWCASE = [
  { id: findTemplate('gemini-sparkle')!, rotate: -9, x: -34, y: 26, z: 10, delay: 0 },
  { id: findTemplate('strawberry-lace-dream')!, rotate: 4, x: 18, y: -6, z: 30, delay: 0.6 },
  { id: findTemplate('xuan-cherry-blossom')!, rotate: 13, x: 66, y: 34, z: 20, delay: 1.2 },
]

export function Hero() {
  const navigate = useNavigate()
  const { decals } = useDecals()

  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-vibe-blue/30 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-vibe-pink/25 blur-3xl" />
        <div className="absolute left-1/3 top-72 h-64 w-64 rounded-full bg-vibe-yellow/30 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-vibe-pink-dark shadow-sm">
            <Sparkles size={14} /> Studio thiết kế nail 3D số đầu tiên tại Việt Nam
          </span>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.12] text-vibe-ink sm:text-5xl lg:text-[3.4rem]">
            Tự thiết kế móng của riêng bạn, để mỗi{' '}
            <span className="vibe-gradient-text">ngón tay lên tiếng</span> cho thần thái.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-vibe-ink-soft sm:text-lg">
            Chọn form móng, phối màu gel thạch, đính charm theo ý thích, xuất công thức &amp; mã QR mang ra tiệm — hoàn toàn miễn phí.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => navigate('/studio')}>
              Bắt đầu thiết kế ngay <ArrowRight size={20} />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <PlayCircle size={20} /> Xem cách hoạt động
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-vibe-ink-soft">
            <Stat value="24" label="bảng phối màu" />
            <Stat value={decals.length ? `${decals.length}` : '…'} label="decal nail art" />
            <Stat value="0đ" label="phí xuất công thức" />
          </div>
        </motion.div>

        <div className="relative mx-auto h-[420px] w-full max-w-md lg:h-[480px]">
          {SHOWCASE.map((s) => (
            <motion.div
              key={s.id.id}
              initial={{ opacity: 0, scale: 0.85, rotate: s.rotate - 6 }}
              animate={{ opacity: 1, scale: 1, rotate: s.rotate }}
              transition={{ duration: 0.7, delay: s.delay * 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: s.z, left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)` }}
              className="absolute w-40 -translate-x-1/2 -translate-y-1/2 sm:w-48"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
                className="relative overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-vibe-lg"
              >
                <TemplatePreviewMedia
                  template={s.id}
                  className="aspect-[2/3] w-full"
                  imageClassName="scale-[1.01]"
                  eager
                />
                {/* Caption lives inside the card's own clipped frame — as a sibling outside
                    this rotated/offset motion.div it would inherit the same rotate+translate
                    as the card and swing sideways into a neighboring stacked card's space,
                    reading as overlapping garbled text (see the landing-page report). Baking
                    it into the frame keeps it attached and upright regardless of the stack's
                    transform. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 pb-2 pt-6">
                  <p className="truncate text-center font-display text-xs font-semibold text-white">{s.id.name}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-bold text-vibe-ink">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}
