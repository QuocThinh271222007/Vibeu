import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useTemplates } from '@/data/loaders'
import { createCommunityPost, uploadCommunityMedia } from '@/lib/communityApi'
import type { Profile } from '@/store/authStore'

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
}

export function NewPostComposer({ profile, onCreated }: { profile: Profile; onCreated: () => void }) {
  const { templates } = useTemplates()
  const [templateId, setTemplateId] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File | null) {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!caption.trim()) {
      setError('Viết vài dòng chia sẻ về bộ nail của bạn nhé.')
      return
    }
    setError(null)
    setSubmitting(true)

    let mediaUrl: string | null = null
    let mediaAlt: string | null = null
    if (file) {
      const { url, error: uploadError } = await uploadCommunityMedia(file, profile.id)
      if (uploadError) {
        setError(uploadError)
        setSubmitting(false)
        return
      }
      mediaUrl = url
      mediaAlt = caption.trim().slice(0, 120)
    }

    const { error: createError } = await createCommunityPost({
      userId: profile.id,
      templateId: templateId || null,
      caption: caption.trim(),
      hashtags: parseHashtags(hashtags),
      mediaUrl,
      mediaAlt,
    })
    setSubmitting(false)
    if (createError) {
      setError(createError)
      return
    }

    setCaption('')
    setHashtags('')
    handleFile(null)
    onCreated()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-[1.75rem] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]"
    >
      <div className="flex items-center gap-3">
        <Avatar name={profile.displayName} color={profile.avatarColor} url={profile.avatarUrl} size={40} />
        <p className="text-sm font-semibold text-vibe-ink">Chia sẻ bộ nail của bạn</p>
      </div>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Kể cho mọi người nghe về bộ nail này..."
        rows={2}
        className="mt-3 w-full resize-none rounded-2xl border-2 border-vibe-ink/10 bg-vibe-cream/40 px-4 py-3 text-sm text-vibe-ink outline-none placeholder:text-vibe-ink-soft/60 focus:border-vibe-pink/50"
      />

      <div className="mt-2.5 flex flex-wrap gap-2.5">
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          title="Chỉ để gắn nhãn mẫu bạn dùng làm nền — bỏ trống nếu đây là thiết kế riêng của bạn, không dựa theo mẫu nào."
          className="rounded-full border-2 border-vibe-ink/10 bg-white px-3.5 py-2 text-xs font-medium text-vibe-ink outline-none focus:border-vibe-pink/50"
        >
          <option value="">Thiết kế riêng (không theo mẫu)</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              Theo mẫu: {t.name}
            </option>
          ))}
        </select>
        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#hashtag #của #bạn"
          className="min-w-[10rem] flex-1 rounded-full border-2 border-vibe-ink/10 bg-white px-3.5 py-2 text-xs font-medium text-vibe-ink outline-none placeholder:text-vibe-ink-soft/50 focus:border-vibe-pink/50"
        />
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-xs font-medium text-vibe-ink-soft transition-colors hover:border-vibe-pink/50 hover:text-vibe-ink"
        >
          <ImagePlus size={15} /> {file ? 'Đổi ảnh' : 'Thêm ảnh thật (tuỳ chọn)'}
        </button>
        {preview && (
          <img src={preview} alt="Xem trước ảnh vừa chọn" className="h-10 w-10 rounded-lg object-cover" />
        )}
      </div>

      {error && <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {submitting ? 'Đang đăng...' : 'Đăng bài'}
        </Button>
      </div>
    </form>
  )
}
