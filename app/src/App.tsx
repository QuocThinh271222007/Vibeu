import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Wrench } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import Home from '@/pages/Home'
import Studio from '@/pages/Studio'
import Library from '@/pages/Library'
import Community from '@/pages/Community'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import About from '@/pages/About'
import Auth from '@/pages/Auth'
import ResetPassword from '@/pages/ResetPassword'
import Settings from '@/pages/Settings'
import SharedDesign from '@/pages/SharedDesign'
import GeometryEditor from '@/pages/GeometryEditor'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminHome from '@/pages/admin/AdminHome'
import AdminBlogList from '@/pages/admin/AdminBlogList'
import AdminBlogEditor from '@/pages/admin/AdminBlogEditor'
import AdminCommunity from '@/pages/admin/AdminCommunity'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminRecipes from '@/pages/admin/AdminRecipes'
import AdminSettings from '@/pages/admin/AdminSettings'
import { useAuthStore } from '@/store/authStore'
import { useSiteSettings } from '@/hooks/useSiteSettings'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function MaintenanceNotice({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-vibe-cream px-4">
      <div className="max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-vibe-lg">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-vibe-cream">
          <Wrench size={28} className="text-vibe-pink-dark" />
        </div>
        <p className="font-display text-lg font-semibold text-vibe-ink">Đang bảo trì</p>
        <p className="mt-2 text-sm text-vibe-ink-soft">{message}</p>
      </div>
    </div>
  )
}

function SiteLayout({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile)
  const settings = useSiteSettings()

  if (settings?.maintenanceMode && profile?.role !== 'admin') {
    return <MaintenanceNotice message={settings.maintenanceMessage} />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => {
    init()
  }, [init])

  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/library" element={<SiteLayout><Library /></SiteLayout>} />
          <Route path="/community" element={<SiteLayout><Community /></SiteLayout>} />
          <Route path="/blog" element={<SiteLayout><Blog /></SiteLayout>} />
          <Route path="/blog/:slug" element={<SiteLayout><BlogPost /></SiteLayout>} />
          <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<SiteLayout><Settings /></SiteLayout>} />
          <Route path="/r/:id" element={<SharedDesign />} />
          {/* Internal calibration utility: intentionally outside SiteLayout and public navigation. */}
          <Route path="/geometry-editor" element={<GeometryEditor />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="blog" element={<AdminBlogList />} />
            <Route path="blog/new" element={<AdminBlogEditor />} />
            <Route path="blog/:id" element={<AdminBlogEditor />} />
            <Route path="community" element={<AdminCommunity />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="recipes" element={<AdminRecipes />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
