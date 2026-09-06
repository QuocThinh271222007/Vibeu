import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { Wrench } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import { PageLoading } from '@/components/ui/PageLoading'
import Home from '@/pages/Home'
import { useAuthStore } from '@/store/authStore'
import { useSiteSettings } from '@/hooks/useSiteSettings'

// Lazy-loaded so the first paint of "/" only ships Home's own code — every other route
// (Studio's canvas compositor especially) downloads its chunk on first visit instead of
// bloating the initial bundle everyone pays for regardless of which page they land on.
const Studio = lazy(() => import('@/pages/Studio'))
const Library = lazy(() => import('@/pages/Library'))
const Community = lazy(() => import('@/pages/Community'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const About = lazy(() => import('@/pages/About'))
const Auth = lazy(() => import('@/pages/Auth'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Settings = lazy(() => import('@/pages/Settings'))
const SharedDesign = lazy(() => import('@/pages/SharedDesign'))
const GeometryEditor = lazy(() => import('@/pages/GeometryEditor'))
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminHome = lazy(() => import('@/pages/admin/AdminHome'))
const AdminBlogList = lazy(() => import('@/pages/admin/AdminBlogList'))
const AdminBlogEditor = lazy(() => import('@/pages/admin/AdminBlogEditor'))
const AdminCommunity = lazy(() => import('@/pages/admin/AdminCommunity'))
const AdminTemplates = lazy(() => import('@/pages/admin/AdminTemplates'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminRecipes = lazy(() => import('@/pages/admin/AdminRecipes'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))

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
      <main className="flex-1">
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </main>
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
          <Route
            path="/studio"
            element={
              <Suspense fallback={<PageLoading />}>
                <Studio />
              </Suspense>
            }
          />
          <Route path="/library" element={<SiteLayout><Library /></SiteLayout>} />
          <Route path="/community" element={<SiteLayout><Community /></SiteLayout>} />
          <Route path="/blog" element={<SiteLayout><Blog /></SiteLayout>} />
          <Route path="/blog/:slug" element={<SiteLayout><BlogPost /></SiteLayout>} />
          <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
          <Route
            path="/auth"
            element={
              <Suspense fallback={<PageLoading />}>
                <Auth />
              </Suspense>
            }
          />
          <Route
            path="/reset-password"
            element={
              <Suspense fallback={<PageLoading />}>
                <ResetPassword />
              </Suspense>
            }
          />
          <Route path="/settings" element={<SiteLayout><Settings /></SiteLayout>} />
          <Route
            path="/r/:id"
            element={
              <Suspense fallback={<PageLoading />}>
                <SharedDesign />
              </Suspense>
            }
          />
          <Route path="/geometry-editor" element={<Navigate to="/admin/geometry" replace />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<PageLoading />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="blog" element={<AdminBlogList />} />
            <Route path="blog/new" element={<AdminBlogEditor />} />
            <Route path="blog/:id" element={<AdminBlogEditor />} />
            <Route path="community" element={<AdminCommunity />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="recipes" element={<AdminRecipes />} />
            <Route path="geometry" element={<GeometryEditor adminMode />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
