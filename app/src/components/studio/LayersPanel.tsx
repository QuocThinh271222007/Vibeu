import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Layers, Lock, Unlock, X } from 'lucide-react'
import { resolveDecalPath, useDecalsById } from '@/data/loaders'
import { useStudioStore } from '@/store/studioStore'
import type { FingerId } from '@/types/vibeu'

/**
 * Every decal on the selected finger, top layer first, plus a fixed non-editable
 * "clear coat" row — it isn't a real StickerInstance the user can select or reorder,
 * just a visual reminder that gloss/material always renders above every decal.
 */
export function LayersPanel({ finger }: { finger: FingerId }) {
  const design = useStudioStore((s) => s.fingers[finger])
  const selectedId = useStudioStore((s) => s.selectedStickerInstance)
  const customDecals = useStudioStore((s) => s.customDecals)
  const selectSticker = useStudioStore((s) => s.selectSticker)
  const setVisible = useStudioStore((s) => s.setStickerVisible)
  const setLocked = useStudioStore((s) => s.setStickerLocked)
  const reorder = useStudioStore((s) => s.reorderSticker)
  const duplicate = useStudioStore((s) => s.duplicateSticker)
  const remove = useStudioStore((s) => s.removeSticker)
  const decalsById = useDecalsById(customDecals)

  const sorted = [...design.stickers].sort((a, b) => b.z - a.z) // top layer (highest z) first

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-vibe-ink">
        <Layers size={15} /> Lớp trên móng này
      </p>

      <div className="flex items-center gap-2 rounded-xl bg-vibe-ink/5 px-3 py-2 text-xs font-semibold text-vibe-ink-soft">
        <span className="h-6 w-6 shrink-0 rounded-md bg-gradient-to-br from-white/80 to-vibe-ink/10" />
        Lớp phủ bóng / chất liệu (luôn ở trên cùng)
      </div>

      {sorted.length === 0 && <p className="py-3 text-center text-xs text-vibe-ink-soft">Chưa có decal nào trên ngón này.</p>}

      <div className="space-y-1.5">
        {sorted.map((st, i) => {
          const asset = decalsById[st.stickerId]
          const selected = st.instanceId === selectedId
          return (
            <div
              key={st.instanceId}
              onClick={() => selectSticker(st.instanceId)}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-2 py-1.5 transition-colors ${
                selected ? 'border-vibe-pink-dark bg-vibe-pink/10' : 'border-transparent bg-white hover:bg-vibe-cream'
              }`}
            >
              {asset && <img src={resolveDecalPath(asset.path)} alt="" className="h-7 w-7 shrink-0 rounded bg-vibe-cream object-contain p-0.5" />}
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-vibe-ink">{asset?.nameVi ?? st.stickerId}</span>

              <LayerIconButton
                label={st.visible === false ? 'Hiện lớp' : 'Ẩn lớp'}
                onClick={() => setVisible(finger, st.instanceId, st.visible === false)}
              >
                {st.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
              </LayerIconButton>
              <LayerIconButton label={st.locked ? 'Mở khóa' : 'Khóa lớp'} onClick={() => setLocked(finger, st.instanceId, !st.locked)}>
                {st.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </LayerIconButton>
              <LayerIconButton label="Lên trên" disabled={i === 0} onClick={() => reorder(finger, st.instanceId, 'up')}>
                <ArrowUp size={14} />
              </LayerIconButton>
              <LayerIconButton label="Xuống dưới" disabled={i === sorted.length - 1} onClick={() => reorder(finger, st.instanceId, 'down')}>
                <ArrowDown size={14} />
              </LayerIconButton>
              <LayerIconButton label="Nhân đôi" onClick={() => duplicate(finger, st.instanceId)}>
                <Copy size={14} />
              </LayerIconButton>
              <LayerIconButton label="Xóa" onClick={() => remove(finger, st.instanceId)}>
                <X size={14} />
              </LayerIconButton>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LayerIconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-vibe-ink-soft transition-colors hover:bg-vibe-ink/10 hover:text-vibe-ink disabled:opacity-25"
    >
      {children}
    </button>
  )
}
