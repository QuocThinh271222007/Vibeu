import { useEffect, useMemo, useState } from 'react'
import { Check, Trash2, UserRound } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { deleteFeedback, fetchFeedbackAdmin, setFeedbackAcknowledged, type SiteFeedback } from '@/lib/feedbackApi'

type StatusFilter = 'new' | 'acknowledged' | 'all'

export default function AdminFeedback() {
  const { push } = useToast()
  const [items, setItems] = useState<SiteFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>('new')

  function reload() {
    setLoading(true)
    fetchFeedbackAdmin().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const newCount = useMemo(() => items.filter((f) => !f.acknowledged).length, [items])

  const filtered = useMemo(
    () => items.filter((f) => (status === 'all' ? true : status === 'new' ? !f.acknowledged : f.acknowledged)),
    [items, status],
  )

  async function handleToggle(f: SiteFeedback) {
    const { error } = await setFeedbackAcknowledged(f.id, !f.acknowledged)
    if (error) {
      push('error', error)
      return
    }
    push('success', f.acknowledged ? 'Đã đánh dấu lại là chưa ghi nhận.' : 'Đã ghi nhận góp ý.')
    reload()
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá góp ý này?')) return
    const { error } = await deleteFeedback(id)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã xoá góp ý.')
    reload()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Góp ý dự án</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">Ý kiến người dùng gửi từ mục "Liên hệ với VIBEU" ở trang Về chúng tôi.</p>

      <div className="mt-5 flex items-center gap-1 rounded-full bg-vibe-cream p-1">
        {(
          [
            ['new', `Chưa ghi nhận${newCount > 0 ? ` (${newCount})` : ''}`],
            ['acknowledged', 'Đã ghi nhận'],
            ['all', 'Tất cả'],
          ] as [StatusFilter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setStatus(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === id ? 'bg-vibe-ink text-white' : 'text-vibe-ink-soft hover:text-vibe-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-vibe-ink-soft shadow-sm">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-vibe-ink-soft shadow-sm">
            {items.length === 0 ? 'Chưa có góp ý nào.' : status === 'new' ? 'Không còn góp ý nào chưa ghi nhận.' : 'Không có góp ý phù hợp.'}
          </p>
        ) : (
          filtered.map((f) => (
            <div key={f.id} className={`rounded-2xl bg-white p-4 shadow-sm ${f.acknowledged ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-vibe-ink">
                    {f.name}
                    {f.userId && (
                      <span className="flex items-center gap-1 rounded-full bg-vibe-blue/15 px-2 py-0.5 text-[10px] font-semibold text-vibe-blue-dark">
                        <UserRound size={10} /> Tài khoản
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-vibe-ink-soft">{new Date(f.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleToggle(f)}
                    title={f.acknowledged ? 'Đánh dấu chưa ghi nhận' : 'Ghi nhận'}
                    className={`grid h-8 w-8 place-items-center rounded-lg hover:bg-emerald-50 ${f.acknowledged ? 'text-emerald-600' : 'text-vibe-ink-soft hover:text-emerald-600'}`}
                  >
                    <Check size={15} />
                  </button>
                  <button onClick={() => handleDelete(f.id)} title="Xoá" className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="mt-2.5 whitespace-pre-wrap text-sm text-vibe-ink">{f.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
