import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AlertTriangle, LayoutDashboard, LibraryBig, Newspaper, QrCode, ScanLine, Settings, ShieldOff, Users2, Users, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

const NAV = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper, end: false },
  { to: '/admin/community', label: 'Cộng đồng', icon: Users2, end: false },
  { to: '/admin/templates', label: 'Thư viện mẫu', icon: LibraryBig, end: false },
  { to: '/admin/recipes', label: 'Công thức & QR', icon: QrCode, end: false },
  { to: '/admin/geometry', label: 'Căn chỉnh móng', icon: ScanLine, end: false },
  { to: '/admin/users', label: 'Người dùng', icon: Users, end: false },
  { to: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings, end: false },
]

export default function AdminLayout() {
  const { status, profile } = useAuthStore()
  const { pathname } = useLocation()
  const geometryEditor = pathname === '/admin/geometry'

  if (!isSupabaseConfigured) {
    return (
      <FullScreenNotice
        icon={<AlertTriangle size={28} className="text-amber-500" />}
        title="Chưa kết nối Supabase"
        message="Thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào app/.env.local (xem .env.example), chạy supabase/schema.sql trong SQL Editor của dự án Supabase, rồi tải lại trang."
      />
    )
  }

  if (status === 'loading') {
    return (
      <FullScreenNotice
        icon={<div className="h-7 w-7 animate-spin rounded-full border-2 border-vibe-pink border-t-transparent" />}
        title="Đang tải..."
        message=""
      />
    )
  }

  if (status === 'signedOut' || !profile) {
    return <Navigate to="/auth?redirect=/admin" replace />
  }

  if (profile.role !== 'admin') {
    return (
      <FullScreenNotice
        icon={<ShieldOff size={28} className="text-red-500" />}
        title="Không có quyền truy cập"
        message="Tài khoản của bạn chưa có quyền quản trị. Một admin có thể cấp quyền cho bạn trong bảng profiles (cột role = 'admin')."
      />
    )
  }

  return (
    <div className="flex min-h-screen bg-vibe-cream">
      <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-vibe-ink/10 bg-white p-4">
        <div className="mb-4 flex items-center justify-between px-1">
          <Logo />
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-vibe-ink text-white' : 'text-vibe-ink-soft hover:bg-vibe-cream'
              }`
            }
          >
            <item.icon size={17} /> {item.label}
          </NavLink>
        ))}
        <Link to="/" className="mt-auto flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-vibe-ink-soft hover:bg-vibe-cream">
          <ArrowLeft size={17} /> Về trang chủ
        </Link>
      </aside>
      <main className={geometryEditor ? 'min-w-0 flex-1 overflow-hidden' : 'flex-1 overflow-x-hidden p-6 sm:p-8'}>
        <Outlet />
      </main>
    </div>
  )
}

function FullScreenNotice({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-vibe-cream px-4">
      <div className="max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-vibe-lg">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-vibe-cream">{icon}</div>
        <p className="font-display text-lg font-semibold text-vibe-ink">{title}</p>
        {message && <p className="mt-2 text-sm text-vibe-ink-soft">{message}</p>}
        <Link to="/" className="mt-5 inline-block text-sm font-semibold text-vibe-pink-dark hover:underline">
          ← Về trang chủ
        </Link>
      </div>
    </div>
  )
}
