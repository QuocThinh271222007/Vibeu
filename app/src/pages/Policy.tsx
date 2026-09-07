import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. Mục đích thu thập dữ liệu',
    body: 'VIBEU là nền tảng được phát triển trong khuôn khổ dự án học tập phi thương mại. Chúng mình chỉ thu thập các thông tin cơ bản gồm: tên tài khoản, địa chỉ email, ảnh bạn tải lên và các mẫu thiết kế 3D nhằm phục vụ việc lưu trữ và tối ưu trải nghiệm thiết kế trên website.',
  },
  {
    title: '2. Quyền sở hữu hình ảnh & Thiết kế',
    body: 'Mọi hình ảnh và mẫu nail do bạn tự phối đều thuộc quyền sở hữu của bạn. Nhóm phát triển cam kết không sử dụng hình ảnh của bạn vào mục đích thương mại hay chia sẻ cho bên ngoài, trừ trường hợp bạn chủ động đăng tải lên bảng tin Cộng Đồng của nền tảng.',
  },
  {
    title: '3. Quản lý và Lưu trữ dữ liệu',
    body: 'Dữ liệu tài khoản, ảnh và thông số móng do bạn tạo được lưu trữ trên nền tảng Supabase và Cloudinary để phục vụ quá trình trải nghiệm trên website. VIBEU phát triển cam kết chỉ sử dụng dữ liệu cho mục đích vận hành đồ án, nền tảng và không chia sẻ cho bên thứ ba vì bất kỳ mục đích thương mại nào.',
  },
  {
    title: '4. Quyền của người dùng & Hỗ trợ',
    body: 'Bạn có thể chỉnh sửa, ẩn thiết kế hoặc yêu cầu nhóm xóa toàn bộ tài khoản và dữ liệu đã lưu bất kỳ lúc nào bằng cách liên hệ qua email dự án: vibeu.nail.vn@gmail.com.',
  },
]

export default function Policy() {
  return (
    <div className="overflow-hidden">
      <section className="mx-auto max-w-3xl px-4 pt-16 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          <ShieldCheck size={13} /> Chính sách
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-4 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl"
        >
          Chính sách bảo mật &amp; <span className="vibe-gradient-text">quyền riêng tư</span>
        </motion.h1>
      </section>

      <section className="mx-auto mt-10 max-w-3xl px-4 pb-24 sm:px-6">
        <div className="space-y-8 rounded-[2rem] bg-vibe-highlight p-7 text-[15px] leading-relaxed text-vibe-ink/90 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] sm:p-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-lg font-semibold text-vibe-ink">{s.title}</h2>
              <p className="mt-2 whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
