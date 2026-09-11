import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { SavedDesignThumb } from '@/components/studio/SavedDesignThumb'
import { Avatar } from '@/components/ui/Avatar'
import { findTemplate } from '@/data/templates'
import { fingersFromTemplate } from '@/lib/templateUtils'
import { fetchLikedPosts, fetchPostsByAuthor, type RemoteCommunityPost } from '@/lib/communityApi'
import { fetchPublicProfile, type PublicProfile } from '@/lib/profileApi'
import { PageMeta } from '@/components/seo/PageMeta'
import { fetchSavedDesigns, type SavedDesignRow } from '@/lib/savedDesignsApi'
import { useAuthStore } from '@/store/authStore'

function PostThumb({ post }: { post: RemoteCommunityPost }) {
  const template = post.templateId ? findTemplate(post.templateId) : undefined
  return (
    <Link to={`/community/${post.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-vibe-cream">
      {post.media ? (
        <img src={post.media.src} alt={post.media.alt} className="h-full w-full object-cover" loading="lazy" />
      ) : template ? (
        <HandCanvas skinTone={template.skinTone} fingers={fingersFromTemplate(template)} className="pointer-events-none rounded-none" />
      ) : null}
      {!post.approved && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">Chờ duyệt</span>
      )}
    </Link>
  )
}

export default function CommunityProfile() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { profile: viewer } = useAuthStore()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [posts, setPosts] = useState<RemoteCommunityPost[]>([])
  const [designs, setDesigns] = useState<SavedDesignRow[]>([])
  const [favorites, setFavorites] = useState<RemoteCommunityPost[]>([])
  const initialTab = searchParams.get('tab') === 'collection' ? 'collection' : searchParams.get('tab') === 'favorites' ? 'favorites' : 'posts'
  const [tab, setTab] = useState<'posts' | 'collection' | 'favorites'>(initialTab)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  function reload() {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    Promise.all([
      fetchPublicProfile(id),
      fetchPostsByAuthor(id, viewer?.id ?? null),
      fetchSavedDesigns(id),
      fetchLikedPosts(id, viewer?.id ?? null),
    ]).then(([p, postList, designList, favoriteList]) => {
      if (!p) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProfile(p)
      setPosts(postList)
      setDesigns(designList)
      setFavorites(favoriteList)
      setLoading(false)
    })
  }

  useEffect(reload, [id, viewer?.id])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/community"
        className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-vibe-ink shadow-sm transition-colors hover:bg-vibe-cream"
      >
        <ArrowLeft size={16} /> Về Cộng đồng
      </Link>

      {loading ? (
        <div className="animate-pulse rounded-[1.75rem] bg-vibe-highlight p-6 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-vibe-cream" />
        </div>
      ) : notFound || !profile ? (
        <p className="rounded-2xl bg-vibe-highlight p-8 text-center text-sm text-vibe-ink-soft shadow-sm">Không tìm thấy người dùng này.</p>
      ) : (
        <>
          <PageMeta
            title={profile.displayName}
            description={`Trang cá nhân của ${profile.displayName} trên VIBEU — ${posts.length} bài đăng, ${designs.length} thiết kế.`}
            canonicalPath={`/u/${profile.id}`}
            image={profile.avatarUrl ?? undefined}
          />
          <div className="flex flex-wrap items-center gap-4 rounded-[1.75rem] bg-vibe-highlight p-6 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]">
            <Avatar name={profile.displayName} color={profile.avatarColor} url={profile.avatarUrl} size={72} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-display text-lg font-semibold text-vibe-ink">
                {profile.displayName}
                {profile.role === 'admin' && (
                  <span className="flex items-center gap-1 rounded-full bg-vibe-blue/15 px-2 py-0.5 text-[10px] font-semibold text-vibe-blue-dark">
                    <ShieldCheck size={11} /> Admin
                  </span>
                )}
              </p>
              <p className="text-sm text-vibe-ink-soft">{profile.handle ?? '@vibeu'}</p>
              <p className="mt-1 text-xs text-vibe-ink-soft">
                {posts.length} bài đăng · {designs.length} thiết kế · {favorites.length} yêu thích · Tham gia{' '}
                {new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            {viewer?.id === profile.id && (
              <Link to="/settings" className="shrink-0 rounded-full border-2 border-vibe-ink/10 px-4 py-2 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40">
                Chỉnh sửa hồ sơ
              </Link>
            )}
          </div>

          <div className="mt-6 flex items-center gap-1 rounded-full bg-vibe-cream p-1">
            <button
              onClick={() => setTab('posts')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${tab === 'posts' ? 'bg-white text-vibe-ink shadow-sm' : 'text-vibe-ink-soft'}`}
            >
              Bài đăng ({posts.length})
            </button>
            <button
              onClick={() => setTab('collection')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${tab === 'collection' ? 'bg-white text-vibe-ink shadow-sm' : 'text-vibe-ink-soft'}`}
            >
              Bộ sưu tập ({designs.length})
            </button>
            <button
              onClick={() => setTab('favorites')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${tab === 'favorites' ? 'bg-white text-vibe-ink shadow-sm' : 'text-vibe-ink-soft'}`}
            >
              Yêu thích ({favorites.length})
            </button>
          </div>

          <div className="mt-4">
            {tab === 'posts' &&
              (posts.length === 0 ? (
                <p className="rounded-2xl bg-vibe-highlight p-6 text-center text-sm text-vibe-ink-soft shadow-sm">Chưa có bài đăng nào.</p>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {posts.map((p) => (
                    <PostThumb key={p.id} post={p} />
                  ))}
                </motion.div>
              ))}

            {tab === 'collection' &&
              (designs.length === 0 ? (
                <p className="rounded-2xl bg-vibe-highlight p-6 text-center text-sm text-vibe-ink-soft shadow-sm">
                  Chưa có thiết kế nào — lưu lại ở Studio bằng nút "Lưu / Mở" để hiện ở đây.
                </p>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {designs.map((d) => (
                    <SavedDesignThumb key={d.id} design={d} canDelete={viewer?.id === profile.id} onDeleted={reload} />
                  ))}
                </motion.div>
              ))}

            {tab === 'favorites' &&
              (favorites.length === 0 ? (
                <p className="rounded-2xl bg-vibe-highlight p-6 text-center text-sm text-vibe-ink-soft shadow-sm">
                  Chưa thích bài đăng nào — bấm ♥ trên bài đăng ở Cộng đồng để lưu vào đây.
                </p>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {favorites.map((p) => (
                    <PostThumb key={p.id} post={p} />
                  ))}
                </motion.div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
