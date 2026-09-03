import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Home from '@/pages/Home'
import Studio from '@/pages/Studio'
import Library from '@/pages/Library'
import Community from '@/pages/Community'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import About from '@/pages/About'
import Auth from '@/pages/Auth'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminHome from '@/pages/admin/AdminHome'
import AdminBlogList from '@/pages/admin/AdminBlogList'
import AdminBlogEditor from '@/pages/admin/AdminBlogEditor'
import AdminCommunity from '@/pages/admin/AdminCommunity'
import AdminUsers from '@/pages/admin/AdminUsers'
import { useAuthStore } from '@/store/authStore'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function SiteLayout({ children }: { children: React.ReactNode }) {
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="blog" element={<AdminBlogList />} />
          <Route path="blog/new" element={<AdminBlogEditor />} />
          <Route path="blog/:id" element={<AdminBlogEditor />} />
          <Route path="community" element={<AdminCommunity />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
