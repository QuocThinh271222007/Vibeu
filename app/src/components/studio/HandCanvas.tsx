import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, RotateCw, X } from 'lucide-react'
import { useColorPresets, useHandData, useStickers, handBaseUrl, stickerAssetUrl } from '@/data/loaders'
import {
  lengthScaleMatrix,
  LENGTH_SCALE,
  localToImage,
  imageToLocal,
  nailWidthPx,
  rotatePointDeg,
  shapeTrimUv,
  trimPolygonToImagePoints,
} from '@/lib/geometry'
import { buildMaterialConfig, buildPaintConfig, DEFAULT_LIGHT, renderNailBitmap } from '@/lib/nailFill'
import { getPreparedHand, type PreparedNail } from '@/lib/nailLighting'
import { clientToSvgPoint } from '@/lib/svgPoint'
import type { FingerDesign, FingerId, NailCoord, SkinToneId, StickerDef, StickerInstance } from '@/types/vibeu'
import { FINGER_ORDER } from '@/types/vibeu'

function usePreparedHand(tone: SkinToneId) {
  const [prepared, setPrepared] = useState<Map<FingerId, PreparedNail> | null>(null)

  useEffect(() => {
    let alive = true
    setPrepared(null)
    getPreparedHand(tone).then((map) => {
      if (alive) setPrepared(map)
    })
    return () => {
      alive = false
    }
  }, [tone])

  return prepared
}

interface HandCanvasProps {
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  interactive?: boolean
  selectedFinger?: FingerId | null
  onSelectFinger?: (finger: FingerId) => void
  selectedStickerInstance?: string | null
  onSelectSticker?: (instanceId: string | null) => void
  onUpdateSticker?: (finger: FingerId, instanceId: string, patch: Partial<StickerInstance>) => void
  onRemoveSticker?: (finger: FingerId, instanceId: string) => void
  onDuplicateSticker?: (finger: FingerId, instanceId: string) => void
  className?: string
}

export function HandCanvas({
  skinTone,
  fingers,
  interactive = false,
  selectedFinger = null,
  onSelectFinger,
  selectedStickerInstance = null,
  onSelectSticker,
  onUpdateSticker,
  onRemoveSticker,
  onDuplicateSticker,
  className = '',
}: HandCanvasProps) {
  const { hand, loading: handLoading } = useHandData(skinTone)
  const { presets, loading: presetsLoading } = useColorPresets()
  const { stickers, loading: stickersLoading } = useStickers()
  const prepared = usePreparedHand(skinTone)
  const svgRef = useRef<SVGSVGElement>(null)

  const presetsById = useMemo(() => Object.fromEntries(presets.map((p) => [p.id, p])), [presets])
  const stickersById = useMemo(() => Object.fromEntries(stickers.map((s) => [s.id, s])), [stickers])

  const ready = hand && !handLoading && !presetsLoading && !stickersLoading && prepared

  if (!ready) {
    return (
      <div className={`relative aspect-[1024/1536] w-full overflow-hidden rounded-[2rem] bg-white/60 ${className}`}>
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.7)_50%,transparent_70%)] bg-[length:200%_100%]" />
        <div className="absolute inset-0 flex items-center justify-center text-vibe-ink-soft/60 text-sm">Đang tải studio…</div>
      </div>
    )
  }

  return (
    <div className={`relative aspect-[1024/1536] w-full select-none ${className}`}>
      <img
        src={handBaseUrl(skinTone)}
        alt="Bàn tay mô phỏng"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full rounded-[2rem] object-cover"
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${hand.width} ${hand.height}`}
        className="absolute inset-0 h-full w-full touch-none overflow-visible"
      >
        {hand.nails.map((nail) => (
          <NailPaint
            key={nail.id}
            nail={nail}
            design={fingers[nail.id]}
            preset={presetsById[fingers[nail.id].presetId]}
            stickersById={stickersById}
            prepared={prepared!.get(nail.id)}
          />
        ))}
        {interactive &&
          hand.nails.map((nail) => (
            <path
              key={`hit-${nail.id}`}
              d={nail.path}
              fill="transparent"
              className="cursor-pointer"
              onPointerDown={(e) => {
                e.stopPropagation()
                onSelectFinger?.(nail.id)
              }}
            />
          ))}
        {interactive && selectedFinger && (
          <StickerGizmoLayer
            svgRef={svgRef}
            nail={hand.nails.find((n) => n.id === selectedFinger)!}
            stickers={fingers[selectedFinger].stickers}
            stickersById={stickersById}
            selectedId={selectedStickerInstance}
            onSelect={(id) => onSelectSticker?.(id)}
            onUpdate={(instanceId, patch) => onUpdateSticker?.(selectedFinger, instanceId, patch)}
            onRemove={(instanceId) => onRemoveSticker?.(selectedFinger, instanceId)}
            onDuplicate={(instanceId) => onDuplicateSticker?.(selectedFinger, instanceId)}
          />
        )}
      </svg>
      {interactive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5 sm:hidden">
          {FINGER_ORDER.map((f) => (
            <span
              key={f}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${f === selectedFinger ? 'bg-vibe-pink-dark' : 'bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NailPaint({
  nail,
  design,
  preset,
  stickersById,
  prepared,
}: {
  nail: NailCoord
  design: FingerDesign
  preset: ReturnType<typeof useColorPresets>['presets'][number] | undefined
  stickersById: Record<string, StickerDef>
  prepared: PreparedNail | undefined
}) {
  const seed = useMemo(() => FINGER_ORDER.indexOf(nail.id), [nail.id])
  const paintCfg = useMemo(() => (preset ? buildPaintConfig(preset, design.customColor) : null), [preset, design.customColor])
  const materialCfg = useMemo(() => (preset ? buildMaterialConfig(preset, design.effect) : null), [preset, design.effect])
  const dataUrl = useMemo(() => {
    if (!prepared || !paintCfg || !materialCfg) return null
    return renderNailBitmap(prepared, paintCfg, materialCfg, DEFAULT_LIGHT, seed).toDataURL()
  }, [prepared, paintCfg, materialCfg, seed])

  if (!preset || !prepared || !dataUrl) return null
  const uid = nail.id
  const trimUv = shapeTrimUv(design.shape)
  const lengthMatrix = lengthScaleMatrix(nail, LENGTH_SCALE[design.length])
  const sorted = [...design.stickers].sort((a, b) => a.z - b.z)

  return (
    <g pointerEvents="none">
      <defs>
        <clipPath id={`clip-real-${uid}`}>
          <path d={nail.path} />
        </clipPath>
        {trimUv && (
          <clipPath id={`clip-trim-${uid}`}>
            <polygon points={trimPolygonToImagePoints(nail, trimUv)} />
          </clipPath>
        )}
      </defs>
      <g clipPath={`url(#clip-real-${uid})`}>
        <g clipPath={trimUv ? `url(#clip-trim-${uid})` : undefined}>
          <g transform={lengthMatrix}>
            <image href={dataUrl} x={prepared.x} y={prepared.y} width={prepared.w} height={prepared.h} preserveAspectRatio="none" />
          </g>
          {sorted.map((st) => (
            <StickerVisual key={st.instanceId} nail={nail} instance={st} sticker={stickersById[st.stickerId]} />
          ))}
        </g>
      </g>
    </g>
  )
}

function StickerVisual({ nail, instance, sticker }: { nail: NailCoord; instance: StickerInstance; sticker: StickerDef | undefined }) {
  if (!sticker) return null
  const [cx, cy] = localToImage(nail, instance.uv)
  const size = nailWidthPx(nail) * sticker.suggestedInitialScaleRelativeToNailWidth * instance.scale
  const variant = sticker.variants[instance.variant]
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${instance.rotation})`}>
      <image
        href={stickerAssetUrl(variant.path)}
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
        style={instance.variant === '3d' ? { filter: 'drop-shadow(0 3px 4px rgba(60,30,60,0.28))' } : undefined}
      />
    </g>
  )
}

type GizmoMode = 'move' | 'rotate' | 'scale' | null

function StickerGizmoLayer({
  svgRef,
  nail,
  stickers,
  stickersById,
  selectedId,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  nail: NailCoord
  stickers: StickerInstance[]
  stickersById: Record<string, StickerDef>
  selectedId: string | null
  onSelect: (id: string | null) => void
  onUpdate: (instanceId: string, patch: Partial<StickerInstance>) => void
  onRemove: (instanceId: string) => void
  onDuplicate: (instanceId: string) => void
}) {
  return (
    <g>
      {stickers.map((instance) => (
        <StickerGizmo
          key={instance.instanceId}
          svgRef={svgRef}
          nail={nail}
          instance={instance}
          sticker={stickersById[instance.stickerId]}
          selected={instance.instanceId === selectedId}
          onSelect={() => onSelect(instance.instanceId)}
          onUpdate={(patch) => onUpdate(instance.instanceId, patch)}
          onRemove={() => onRemove(instance.instanceId)}
          onDuplicate={() => onDuplicate(instance.instanceId)}
        />
      ))}
    </g>
  )
}

function StickerGizmo({
  svgRef,
  nail,
  instance,
  sticker,
  selected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  nail: NailCoord
  instance: StickerInstance
  sticker: StickerDef | undefined
  selected: boolean
  onSelect: () => void
  onUpdate: (patch: Partial<StickerInstance>) => void
  onRemove: () => void
  onDuplicate: () => void
}) {
  const [mode, setMode] = useState<GizmoMode>(null)
  const dragInfo = useRef<{ startAngleOffset: number; baseSize: number; moveOffset: [number, number] }>({
    startAngleOffset: 0,
    baseSize: 1,
    moveOffset: [0, 0],
  })

  if (!sticker) return null

  const [cx, cy] = localToImage(nail, instance.uv)
  const baseSize = nailWidthPx(nail) * sticker.suggestedInitialScaleRelativeToNailWidth
  const size = baseSize * instance.scale
  const hs = size / 2
  // Handles are sized in image-space units but the canvas renders far smaller than
  // its 1024px-wide viewBox (e.g. ~340px in the studio), so a "visually right" handle
  // must be oversized here to still clear a ~44px touch target on screen.
  const handleR = 50
  const scaleHandleHalf = 34
  const smallBtnR = 42

  const startDrag = (m: GizmoMode) => (e: React.PointerEvent) => {
    e.stopPropagation()
    onSelect()
    const svg = svgRef.current
    if (!svg) return
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setMode(m)
    const [px, py] = clientToSvgPoint(svg, e.clientX, e.clientY)
    if (m === 'rotate') {
      const angleToPointer = (Math.atan2(py - cy, px - cx) * 180) / Math.PI
      dragInfo.current.startAngleOffset = instance.rotation - angleToPointer
    }
    if (m === 'scale') {
      dragInfo.current.baseSize = baseSize
    }
    if (m === 'move') {
      dragInfo.current.moveOffset = [cx - px, cy - py]
    }
  }

  const onMove = (e: React.PointerEvent) => {
    if (!mode) return
    const svg = svgRef.current
    if (!svg) return
    const [px, py] = clientToSvgPoint(svg, e.clientX, e.clientY)
    if (mode === 'move') {
      const [ox, oy] = dragInfo.current.moveOffset
      const uv = imageToLocal(nail, [px + ox, py + oy])
      const clamped: [number, number] = [Math.min(1.2, Math.max(-0.2, uv[0])), Math.min(1.25, Math.max(-0.2, uv[1]))]
      onUpdate({ uv: clamped })
    } else if (mode === 'rotate') {
      const angle = (Math.atan2(py - cy, px - cx) * 180) / Math.PI
      onUpdate({ rotation: Math.round(angle + dragInfo.current.startAngleOffset) })
    } else if (mode === 'scale') {
      const dist = Math.hypot(px - cx, py - cy)
      const restDist = (dragInfo.current.baseSize / 2) * Math.SQRT2
      const scale = Math.min(2.6, Math.max(0.35, dist / restDist))
      onUpdate({ scale })
    }
  }

  const endDrag = () => setMode(null)

  const [scaleDx, scaleDy] = rotatePointDeg(hs, hs, instance.rotation)
  const [rotDx, rotDy] = rotatePointDeg(0, -hs - handleR - 14, instance.rotation)
  const [delDx, delDy] = rotatePointDeg(hs, -hs, instance.rotation)
  const [dupDx, dupDy] = rotatePointDeg(-hs, -hs, instance.rotation)

  return (
    <g>
      <rect
        x={-hs}
        y={-hs}
        width={size}
        height={size}
        transform={`translate(${cx} ${cy}) rotate(${instance.rotation})`}
        fill="transparent"
        stroke={selected ? 'var(--color-vibe-pink-dark)' : 'transparent'}
        strokeWidth={selected ? 3 : 0}
        strokeDasharray={selected ? '10 6' : undefined}
        rx={size * 0.12}
        className="cursor-move"
        onPointerDown={startDrag('move')}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      {selected && (
        <>
          <line x1={cx} y1={cy - hs} x2={cx + rotDx} y2={cy + rotDy} stroke="var(--color-vibe-pink-dark)" strokeWidth={3} opacity={0.6} />
          <g
            transform={`translate(${cx + rotDx} ${cy + rotDy})`}
            onPointerDown={startDrag('rotate')}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="cursor-grab"
          >
            <circle r={handleR} fill="white" stroke="var(--color-vibe-pink-dark)" strokeWidth={4} />
            <RotateCw x={-handleR * 0.45} y={-handleR * 0.45} width={handleR * 0.9} height={handleR * 0.9} color="#c93fc0" strokeWidth={2.4} />
          </g>

          <g
            transform={`translate(${cx + scaleDx} ${cy + scaleDy})`}
            onPointerDown={startDrag('scale')}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="cursor-nwse-resize"
          >
            <rect x={-scaleHandleHalf} y={-scaleHandleHalf} width={scaleHandleHalf * 2} height={scaleHandleHalf * 2} rx={14} fill="white" stroke="var(--color-vibe-blue-dark)" strokeWidth={4} />
            <path
              d="M -13 13 L 13 -13 M -3 -13 L 13 -13 L 13 3 M 3 13 L -13 13 L -13 -3"
              stroke="#3c6dae"
              strokeWidth={3.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          <g transform={`translate(${cx + delDx} ${cy + delDy})`} onPointerDown={(e) => { e.stopPropagation(); onRemove() }} className="cursor-pointer">
            <circle r={smallBtnR} fill="white" stroke="#e5484d" strokeWidth={4} />
            <X x={-smallBtnR * 0.5} y={-smallBtnR * 0.5} width={smallBtnR} height={smallBtnR} color="#e5484d" strokeWidth={3} />
          </g>

          <g transform={`translate(${cx + dupDx} ${cy + dupDy})`} onPointerDown={(e) => { e.stopPropagation(); onDuplicate() }} className="cursor-pointer">
            <circle r={smallBtnR} fill="white" stroke="var(--color-vibe-yellow-dark)" strokeWidth={4} />
            <Copy x={-smallBtnR * 0.45} y={-smallBtnR * 0.45} width={smallBtnR * 0.9} height={smallBtnR * 0.9} color="#c98a1f" strokeWidth={2.6} />
          </g>
        </>
      )}
    </g>
  )
}
