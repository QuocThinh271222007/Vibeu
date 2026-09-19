import { BrowserRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom'
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
const CommunityPost = lazy(() => import('@/pages/CommunityPost'))
const CommunityProfile = lazy(() => import('@/pages/CommunityProfile'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const About = lazy(() => import('@/pages/About'))
const Policy = lazy(() => import('@/pages/Policy'))
const Auth = lazy(() => import('@/pages/Auth'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Settings = lazy(() => import('@/pages/Settings'))
const SharedDesign = lazy(() => import('@/pages/SharedDesign'))
const GeometryEditor = lazy(() => import('@/pages/GeometryEditor'))
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminHome = lazy(() => import('@/pages/admin/AdminHome'))
const AdminBlogList = lazy(() => import('@/pages/admin/AdminBlogList'))
const AdminBlogEditor = lazy(() => import('@/pages/admin/AdminBlogEditor'))
const AdminBlogSeries = lazy(() => import('@/pages/admin/AdminBlogSeries'))
const AdminBlogCategories = lazy(() => import('@/pages/admin/AdminBlogCategories'))
const AdminCommunity = lazy(() => import('@/pages/admin/AdminCommunity'))
const AdminFeedback = lazy(() => import('@/pages/admin/AdminFeedback'))
const AdminTemplates = lazy(() => import('@/pages/admin/AdminTemplates'))
const AdminDecals = lazy(() => import('@/pages/admin/AdminDecals'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminRecipes = lazy(() => import('@/pages/admin/AdminRecipes'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminPerformance = lazy(() => import('@/pages/admin/AdminPerformance'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // The target (e.g. the footer's "Gửi câu hỏi cho chúng tôi" -> /about#gop-y) lives on
      // a lazy-loaded route's page component, which may not have mounted yet the instant the
      // location changes — poll briefly instead of giving up after one missed getElementById.
      let attempts = 0
      const tryScroll = () => {
        const el = document.getElementById(hash.slice(1))
        if (el) {
          el.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
        } else if (attempts++ < 20) {
          setTimeout(tryScroll, 100)
        }
      }
      tryScroll()
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

function MaintenanceNotice({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-vibe-cream px-4">
      <div className="max-w-sm rounded-[2rem] bg-vibe-highlight p-8 text-center shadow-vibe-lg">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-vibe-cream">
          <Wrench size={28} className="text-vibe-pink-dark" />
        </div>
        <p className="font-display text-lg font-semibold text-vibe-ink">Đang bảo trì</p>
        <p className="mt-2 text-sm text-vibe-ink-soft">{message}</p>
      </div>
    </div>
  )
}

function RedirectCommunityPost() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/cong-dong/${id}`} replace />
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
          <Route path="/thu-vien" element={<SiteLayout><Library /></SiteLayout>} />
          <Route path="/cong-dong" element={<SiteLayout><Community /></SiteLayout>} />
          <Route path="/cong-dong/:id" element={<SiteLayout><CommunityPost /></SiteLayout>} />
          <Route path="/u/:id" element={<SiteLayout><CommunityProfile /></SiteLayout>} />
          {/* Old English slugs — kept as redirects so existing bookmarks/search-indexed links
              (Search Console had already started crawling /library and /community) still land
              on the right page instead of 404ing. */}
          <Route path="/library" element={<Navigate to="/thu-vien" replace />} />
          <Route path="/community" element={<Navigate to="/cong-dong" replace />} />
          <Route path="/community/:id" element={<RedirectCommunityPost />} />
          <Route path="/blog" element={<SiteLayout><Blog /></SiteLayout>} />
          <Route path="/blog/:slug" element={<SiteLayout><BlogPost /></SiteLayout>} />
          <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
          <Route path="/chinh-sach" element={<SiteLayout><Policy /></SiteLayout>} />
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
            <Route path="blog-series" element={<AdminBlogSeries />} />
            <Route path="blog-categories" element={<AdminBlogCategories />} />
            <Route path="community" element={<AdminCommunity />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="decals" element={<AdminDecals />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="recipes" element={<AdminRecipes />} />
            <Route path="geometry" element={<GeometryEditor adminMode />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="performance" element={<AdminPerformance />} />
          </Route>
          {/* Catch-all — must stay last. See NotFound.tsx for why this can't be a real HTTP 404
              on this static-hosting setup without a server/CDN rewrite rule. */}
          <Route path="*" element={<SiteLayout><NotFound /></SiteLayout>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
