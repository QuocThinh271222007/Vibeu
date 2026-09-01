import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Compass, Gem, Sparkles, Target, Users, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/home/WhyUs'

const VALUES = [
  { icon: Sparkles, title: 'Sáng tạo không giới hạn', desc: 'Mỗi người một vibe riêng, không có khuôn mẫu cố định.' },
  { icon: Gem, title: 'Chính xác nhờ công nghệ', desc: 'Mô phỏng 3D giúp bạn thấy trước kết quả trước khi ra tiệm.' },
  { icon: Users, title: 'Kết nối cộng đồng', desc: 'Chia sẻ, lưu mẫu và truyền cảm hứng cùng nhau.' },
  { icon: Wrench, title: 'Hỗ trợ thợ nail', desc: 'Công thức rõ ràng, tiết kiệm thời gian trao đổi tại tiệm.' },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="overflow-hidden">
      <section className="mx-auto max-w-4xl px-4 pt-16 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Về chúng tôi
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-4 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl"
        >
          Mỗi người có một "vibe" riêng, vậy tại sao <span className="vibe-gradient-text">bộ nail lại phải giống nhau?</span>
        </motion.h1>
      </section>

      <section className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        <div className="space-y-5 rounded-[2rem] bg-white p-7 text-[15px] leading-relaxed text-vibe-ink/90 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] sm:p-10">
          <p>
            VIBEU ra đời từ mong muốn giúp mỗi người tự tạo nên bộ nail mang đậm cá tính của mình. Chúng mình nhận ra rằng việc tìm một mẫu nail thật sự phù hợp thường mất nhiều thời gian, trong khi khách hàng lại khó hình dung kết quả cuối cùng trước khi đến tiệm.
          </p>
          <p>
            Vì vậy, VIBEU tạo ra một <strong className="text-vibe-ink">Studio Sáng Tạo Số</strong>, nơi bạn có thể tự custom bộ nail, thoải mái lựa chọn form móng, màu sắc và các chi tiết theo sở thích. Bạn có thể nhìn thấy ý tưởng của mình trước khi đến tiệm, dễ dàng trao đổi với thợ và tiết kiệm thời gian trong quá trình làm nail.
          </p>
          <p className="font-display text-lg font-medium text-vibe-pink-dark">
            VIBEU tin rằng đôi bàn tay bạn là một bức tranh, và chính bạn là người nghệ sĩ.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[1.75rem] bg-[linear-gradient(160deg,#EAF2FF,#DCE9FB)] p-8"
        >
          <Compass className="text-vibe-blue-dark" size={30} />
          <h3 className="mt-4 font-display text-xl font-semibold text-vibe-ink">Tầm nhìn</h3>
          <p className="mt-2 text-sm leading-relaxed text-vibe-ink-soft">
            Trong 3-5 năm tới, VIBEU hướng đến trở thành website hỗ trợ thiết kế nail được Gen Z yêu thích, giúp người dùng dễ dàng tìm kiếm cảm hứng và tạo ra thiết kế phù hợp với phong cách cá nhân tại Việt Nam.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-[1.75rem] bg-[linear-gradient(160deg,#FFE9FB,#FFD9F7)] p-8"
        >
          <Target className="text-vibe-pink-dark" size={30} />
          <h3 className="mt-4 font-display text-xl font-semibold text-vibe-ink">Sứ mệnh</h3>
          <p className="mt-2 text-sm leading-relaxed text-vibe-ink-soft">
            VIBEU giúp mọi người dễ dàng khám phá phong cách cá nhân và tự tạo thiết kế nail phù hợp với chính mình, biến việc chọn nail từ một quyết định khó khăn thành một trải nghiệm sáng tạo, thú vị và mang đậm dấu ấn cá nhân.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Giá trị cốt lõi" title="Điều làm nên VIBEU" center />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="rounded-[1.5rem] bg-white p-6 text-center shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-vibe-cream">
                <v.icon size={22} className="text-vibe-pink-dark" />
              </div>
              <h4 className="mt-4 font-display text-sm font-semibold text-vibe-ink">{v.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-vibe-ink-soft">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['Trẻ trung', 'Cá tính', 'Thân thiện', 'Sáng tạo', 'Hiện đại'].map((k) => (
            <span key={k} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-vibe-ink-soft shadow-sm">
              #{k}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
        <Button size="lg" onClick={() => navigate('/studio')}>
          Bắt đầu thiết kế ngay
        </Button>
      </section>
    </div>
  )
}
