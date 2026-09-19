import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { PageMeta } from '@/components/seo/PageMeta'

/**
 * Static hosting (this is a build-once, upload-the-files SPA — see supabase/migrations for the
 * deploy story) can't return a real HTTP 404 status for an arbitrary client-side route the way a
 * server-rendered app could: any unknown path still gets served index.html with a 200. noindex
 * here is the safest available substitute — it stops the URL from actually being indexed even
 * though the status code itself can't be corrected without a server/CDN rewrite rule (see
 * deploy/nginx.conf.example for the rule that WOULD fix this at the infrastructure level).
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <PageMeta title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại hoặc đã bị di chuyển." canonicalPath="/404" noindex />
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-vibe-highlight text-vibe-pink-dark">
        <Compass size={30} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-vibe-ink">Không tìm thấy trang này</h1>
      <p className="mt-2 text-sm text-vibe-ink-soft">
        Đường dẫn bạn vào không tồn tại, đã bị xoá, hoặc đã được chuyển sang địa chỉ khác.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-vibe-ink px-6 py-3 text-sm font-semibold text-white shadow-vibe transition-colors hover:bg-vibe-ink/90"
      >
        <ArrowLeft size={16} /> Về trang chủ
      </Link>
    </div>
  )
}
