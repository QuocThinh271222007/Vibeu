import { useEffect, useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { deleteSharedDesign, fetchAllSharedDesignsAdmin, type SharedDesignAdminRow } from '@/lib/shareApi'

export default function AdminRecipes() {
  const { push } = useToast()
  const [rows, setRows] = useState<SharedDesignAdminRow[]>([])
  const [loading, setLoading] = useState(true)

  function reload() {
    setLoading(true)
    fetchAllSharedDesignsAdmin().then((data) => {
      setRows(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  async function handleDelete(id: string) {
    if (!confirm('Xoá bản lưu công thức này? Mã QR đã in trước đó vẫn có thể hoạt động nếu dữ liệu được nhúng ngay trong mã (không phụ thuộc bản lưu này).')) return
    const { error } = await deleteSharedDesign(id)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã xoá bản lưu công thức.')
    reload()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Công thức &amp; Mã QR</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">
        Mỗi lần người dùng bấm "Xuất công thức &amp; Mã QR" trong Studio, bản thiết kế được lưu ở đây (bên cạnh việc mã hoá trực tiếp vào mã QR) để có thể xem/kiểm duyệt và làm phương án dự phòng cho các mã QR quá chi tiết.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-vibe-ink/10 text-xs uppercase tracking-wide text-vibe-ink-soft">
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tông da</th>
              <th className="px-4 py-3">Người tạo</th>
              <th className="px-4 py-3">Lượt xem</th>
              <th className="px-4 py-3">Tạo lúc</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Chưa có công thức nào được xuất.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-vibe-ink/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-vibe-ink">{r.id}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{r.skinTone === 'cozy' ? 'Sáng' : 'Ấm'}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{r.ownerName ?? 'Khách (chưa đăng nhập)'}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{r.viewCount}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a href={`/r/${r.id}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-vibe-cream hover:text-vibe-ink">
                        <Eye size={15} />
                      </a>
                      <button onClick={() => handleDelete(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
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
