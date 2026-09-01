import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function CtaBanner() {
  const navigate = useNavigate()
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(120deg,#7fa8e0,#ff92f9_55%,#ffd879)] bg-[length:200%_200%] px-8 py-16 text-center shadow-vibe-lg sm:px-16"
      >
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 animate-float rounded-full bg-white/15" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 animate-float rounded-full bg-white/10 [animation-delay:1.5s]" />

        <Sparkles className="mx-auto text-white/90" size={30} />
        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold text-white sm:text-4xl">
          Sẵn sàng tạo dấu ấn riêng?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-white/90">
          Chỉ mất vài phút để có bộ nail mang đậm chất riêng của bạn — miễn phí hoàn toàn.
        </p>
        <Button
          size="lg"
          variant="dark"
          className="mt-8 bg-vibe-ink text-white shadow-xl"
          onClick={() => navigate('/studio')}
        >
          Bắt đầu thiết kế
        </Button>
      </motion.div>
    </section>
  )
}
