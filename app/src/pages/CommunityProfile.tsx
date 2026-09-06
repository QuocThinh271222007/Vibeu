import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { Avatar } from '@/components/ui/Avatar'
import { findTemplate } from '@/data/templates'
import { fingersFromTemplate } from '@/lib/templateUtils'
import { fetchPostsByAuthor, type RemoteCommunityPost } from '@/lib/communityApi'
import { fetchPublicProfile, type PublicProfile } from '@/lib/profileApi'
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
  const { profile: viewer } = useAuthStore()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [posts, setPosts] = useState<RemoteCommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    Promise.all([fetchPublicProfile(id), fetchPostsByAuthor(id, viewer?.id ?? null)]).then(([p, list]) => {
      if (!p) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProfile(p)
      setPosts(list)
      setLoading(false)
    })
  }, [id, viewer?.id])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/community"
        className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-vibe-ink shadow-sm transition-colors hover:bg-vibe-cream"
      >
        <ArrowLeft size={16} /> Về Cộng đồng
      </Link>

      {loading ? (
        <div className="animate-pulse rounded-[1.75rem] bg-white p-6 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-vibe-cream" />
        </div>
      ) : notFound || !profile ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-vibe-ink-soft shadow-sm">Không tìm thấy người dùng này.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-[1.75rem] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]">
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
                {posts.length} bài đăng · Tham gia {new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            {viewer?.id === profile.id && (
              <Link to="/settings" className="shrink-0 rounded-full border-2 border-vibe-ink/10 px-4 py-2 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40">
                Chỉnh sửa hồ sơ
              </Link>
            )}
          </div>

          <div className="mt-6">
            {posts.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-center text-sm text-vibe-ink-soft shadow-sm">Chưa có bài đăng nào.</p>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {posts.map((p) => (
                  <PostThumb key={p.id} post={p} />
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
