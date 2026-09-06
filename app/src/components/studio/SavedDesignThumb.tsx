import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { useToast } from '@/components/ui/Toast'
import { deleteSavedDesign, type SavedDesignRow } from '@/lib/savedDesignsApi'

/** One "Lưu/Mở" saved design as a live-rendered card — used on both a user's public
 * profile ("Bộ sưu tập" tab) and their own account settings page. */
export function SavedDesignThumb({ design, canDelete, onDeleted }: { design: SavedDesignRow; canDelete: boolean; onDeleted: () => void }) {
  const { push } = useToast()

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm(`Xoá thiết kế "${design.name}"?`)) return
    const { error } = await deleteSavedDesign(design.id)
    if (error) {
      push('error', error)
      return
    }
    onDeleted()
  }

  return (
    <Link to={`/studio?design=${design.id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-vibe-cream">
      <HandCanvas skinTone={design.skinTone} fingers={design.fingers} className="pointer-events-none rounded-none" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-2.5 pb-2 pt-6">
        <p className="truncate text-[11px] font-medium text-white">{design.name}</p>
      </div>
      {canDelete && (
        <button
          onClick={handleDelete}
          title="Xoá thiết kế"
          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      )}
    </Link>
  )
}
