import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, QrCode, Users, Users2 } from 'lucide-react'
import { fetchAdminCounts, type AdminCounts } from '@/lib/adminApi'
import { BLOG_POSTS } from '@/data/blog'
import { COMMUNITY_POSTS } from '@/data/community'

export default function AdminHome() {
  const [counts, setCounts] = useState<AdminCounts | null>(null)

  useEffect(() => {
    fetchAdminCounts().then(setCounts)
  }, [])

  const cards = [
    { label: 'Người dùng đã đăng ký', value: counts?.users ?? '…', icon: Users, to: '/admin/users' },
    {
      label: 'Bài đăng Cộng đồng',
      value: counts !== null ? counts.communityPosts + COMMUNITY_POSTS.length : '…',
      hint: `${COMMUNITY_POSTS.length} bài demo có sẵn + ${counts?.communityPosts ?? 0} bài từ người dùng`,
      icon: Users2,
      to: '/admin/community',
    },
    {
      label: 'Bài viết Blog',
      value: counts !== null ? counts.blogPosts + BLOG_POSTS.length : '…',
      hint: `${BLOG_POSTS.length} bài biên tập sẵn + ${counts?.blogPosts ?? 0} bài đã đăng qua trang này`,
      icon: Newspaper,
      to: '/admin/blog',
    },
    {
      label: 'Công thức đã xuất (QR)',
      value: counts?.sharedDesigns ?? '…',
      icon: QrCode,
      to: '/admin/recipes',
    },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Tổng quan</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">Quản lý dữ liệu Blog, Cộng đồng và tài khoản người dùng của VIBEU.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-vibe">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-vibe-cream text-vibe-pink-dark">
              <c.icon size={18} />
            </span>
            <p className="mt-3 font-display text-2xl font-bold text-vibe-ink">{c.value}</p>
            <p className="text-sm text-vibe-ink-soft">{c.label}</p>
            {c.hint && <p className="mt-1 text-[11px] text-vibe-ink-soft/70">{c.hint}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-display text-sm font-semibold text-vibe-ink">Ghi chú</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-vibe-ink-soft">
          <li>Nội dung mẫu (Thư viện, một số bài Blog/Cộng đồng) được đóng gói sẵn trong mã nguồn — trang này quản lý phần dữ liệu động lưu trên Supabase.</li>
          <li>Để cấp quyền admin cho một tài khoản khác, vào tab "Người dùng" và đổi vai trò.</li>
          <li>Thư viện mẫu nail (form/màu/hiệu ứng) vẫn được cấu hình trong mã nguồn, chưa có giao diện quản trị riêng.</li>
        </ul>
      </div>
    </div>
  )
}
