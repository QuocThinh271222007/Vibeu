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
      </Routes>
    </BrowserRouter>
  )
}
