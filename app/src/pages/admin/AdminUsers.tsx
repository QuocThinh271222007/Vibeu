import { useEffect, useMemo, useState } from 'react'
import { Search, Shield, ShieldCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { fetchAllProfiles, setUserRole, type AdminProfileRow } from '@/lib/adminApi'
import { useAuthStore } from '@/store/authStore'

export default function AdminUsers() {
  const { profile: me } = useAuthStore()
  const { push } = useToast()
  const [rows, setRows] = useState<AdminProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  function reload() {
    setLoading(true)
    return fetchAllProfiles().then((data) => {
      setRows(data)
      setLoading(false)
      return data
    })
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.display_name.toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q))
  }, [rows, query])

  async function toggleRole(row: AdminProfileRow) {
    const nextRole = row.role === 'admin' ? 'user' : 'admin'
    if (row.id === me?.id && nextRole === 'user' && !confirm('Bạn sẽ tự bỏ quyền admin của chính mình. Tiếp tục?')) return
    setBusyId(row.id)
    await setUserRole(row.id, nextRole)
    const fresh = await reload()
    setBusyId(null)
    const updated = fresh.find((r) => r.id === row.id)
    if (updated?.role !== nextRole) {
      push('error', 'Không thể bỏ quyền admin — đây là admin duy nhất còn lại. Hãy cấp quyền cho người khác trước.')
      return
    }
    push('success', nextRole === 'admin' ? `Đã cấp quyền admin cho ${row.display_name}.` : `Đã bỏ quyền admin của ${row.display_name}.`)
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Người dùng</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">Danh sách tài khoản đã đăng ký. Cấp quyền admin cho tài khoản đáng tin cậy.</p>

      <label className="mt-5 flex max-w-xs items-center gap-2 rounded-full border-2 border-vibe-ink/10 bg-white px-4 py-2">
        <Search size={15} className="text-vibe-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
        />
      </label>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-vibe-ink/10 text-xs uppercase tracking-wide text-vibe-ink-soft">
              <th className="px-4 py-3">Tên hiển thị</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Tham gia</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-vibe-ink-soft">
                  {rows.length === 0 ? 'Chưa có ai đăng ký.' : 'Không tìm thấy tài khoản phù hợp.'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-vibe-ink/5 last:border-0">
                  <td className="flex items-center gap-2.5 px-4 py-3 font-medium text-vibe-ink">
                    <Avatar name={r.display_name} color={r.avatar_color} url={r.avatar_url} size={32} />
                    {r.display_name}
                  </td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.role === 'admin' ? 'bg-vibe-pink/15 text-vibe-pink-dark' : 'bg-vibe-cream text-vibe-ink-soft'}`}>
                      {r.role === 'admin' ? 'Admin' : 'Thành viên'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRole(r)}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-xs font-medium text-vibe-ink transition-colors hover:border-vibe-pink/50 disabled:opacity-50"
                    >
                      {r.role === 'admin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                      {r.role === 'admin' ? 'Bỏ quyền admin' : 'Cấp quyền admin'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
