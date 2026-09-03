import { useEffect, useState } from 'react'
import { Shield, ShieldCheck } from 'lucide-react'
import { fetchAllProfiles, setUserRole, type AdminProfileRow } from '@/lib/adminApi'
import { useAuthStore } from '@/store/authStore'

export default function AdminUsers() {
  const { profile: me } = useAuthStore()
  const [rows, setRows] = useState<AdminProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    fetchAllProfiles().then((data) => {
      setRows(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  async function toggleRole(row: AdminProfileRow) {
    const nextRole = row.role === 'admin' ? 'user' : 'admin'
    if (row.id === me?.id && nextRole === 'user' && !confirm('Bạn sẽ tự bỏ quyền admin của chính mình. Tiếp tục?')) return
    setBusyId(row.id)
    await setUserRole(row.id, nextRole)
    setBusyId(null)
    reload()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Người dùng</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">Danh sách tài khoản đã đăng ký. Cấp quyền admin cho tài khoản đáng tin cậy.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Chưa có ai đăng ký.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-vibe-ink/5 last:border-0">
                  <td className="flex items-center gap-2.5 px-4 py-3 font-medium text-vibe-ink">
                    <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" style={{ background: r.avatar_color }}>
                      {r.display_name.charAt(0).toUpperCase()}
                    </span>
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
