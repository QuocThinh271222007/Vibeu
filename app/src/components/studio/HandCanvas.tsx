import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Copy, RotateCw, X } from 'lucide-react'
import { useColorPresets, useHandData, useDecalsById, handBaseUrl, resolveDecalPath } from '@/data/loaders'
import {
  lengthScaleMatrix,
  LENGTH_SCALE,
  localToImage,
  imageToLocal,
  nailWidthPx,
  rotatePointDeg,
  shapeTrimUv,
  trimPolygonToImagePoints,
  uniformShapeLength,
} from '@/lib/geometry'
import { maskGrowPxFor } from '@/lib/nailEdgeTuning'
import {
  buildMaterialConfig,
  buildPaintConfig,
  composeCharmLayer,
  composeNail,
  DEFAULT_LIGHT,
  hexToRgb01,
  renderDebugView,
  type DebugViewMode,
  type DecalLayer,
  type LightState,
} from '@/lib/nailFill'
import { getPreparedHand, type PreparedNail } from '@/lib/nailLighting'
import { getResolvedDecalAsset, type ResolvedDecalAsset } from '@/lib/decalCache'
import { clientToSvgPoint } from '@/lib/svgPoint'
import { useStudioStore } from '@/store/studioStore'
import type { DecalAsset, FingerDesign, FingerId, NailCoord, NailLength, NailShape, SkinToneId, StickerInstance } from '@/types/vibeu'
import { FINGER_ORDER } from '@/types/vibeu'

/** Decodes+caches decal pixel data for a set of image URLs, keyed by the URL set itself. */
function useResolvedDecalAssets(urls: string[]): Map<string, ResolvedDecalAsset> {
  const key = urls.join('|')
  const [map, setMap] = useState<Map<string, ResolvedDecalAsset>>(new Map())

  useEffect(() => {
    if (!urls.length) {
      setMap(new Map())
      return
    }
    let alive = true
    Promise.all(urls.map((u) => getResolvedDecalAsset(u).then((r) => [u, r] as const))).then((entries) => {
      if (alive) setMap(new Map(entries))
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return map
}

function usePreparedHand(tone: SkinToneId, shape?: NailShape, length?: NailLength) {
  const [prepared, setPrepared] = useState<Map<FingerId, PreparedNail> | null>(null)

  useEffect(() => {
    let alive = true
    setPrepared(null)
    getPreparedHand(tone, shape, length).then((map) => {
      if (alive) setPrepared(map)
    })
    return () => {
      alive = false
    }
  }, [tone, shape, length])

  return prepared
}

/**
 * While a sticker gizmo is actively being dragged, the full lit raster (with
 * its curvature-warped decals + clear coat) is NOT recomputed on every
 * pointermove — measured at ~260ms/event for a single nail, that would make
 * dragging unusably janky. Instead the dragged sticker is excluded from that
 * nail's baked composite and shown as a cheap flat preview on top; the real
 * composite (with the sticker properly lit and curvature-warped) is only
 * rebaked once, on pointerup, when the change is committed to the store.
 */
interface LiveDragOverride {
  finger: FingerId
  instanceId: string
  patch: Partial<StickerInstance>
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
  /** Freehand draw tool (DrawTab) — while true, touching any nail starts a brush stroke
   * instead of the normal select/deselect-sticker behavior. */
  drawMode?: boolean
  brushWidth?: number
  brushColor?: string
  onAddStroke?: (finger: FingerId, points: [number, number][]) => void
  className?: string
}

/** Image-space SVG path "d" for a polyline of nail-local uv points — shared by the
 * committed-stroke render in NailPaint and the live in-progress preview below. */
function strokePathD(nail: NailCoord, points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${localToImage(nail, p).join(' ')}`).join(' ')
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
  drawMode = false,
  brushWidth = 4,
  brushColor = '#FF2D87',
  onAddStroke,
  className = '',
}: HandCanvasProps) {
  // Only a whole-hand shape+length (all 5 fingers agreeing) can select a different real
  // photo — see uniformShapeLength's doc comment in geometry.ts for why a mixed set can't.
  const variant = useMemo(() => uniformShapeLength(fingers), [fingers])
  const { hand, loading: handLoading } = useHandData(skinTone, variant?.shape, variant?.length)
  const { presets, loading: presetsLoading } = useColorPresets()
  const customDecals = useStudioStore((s) => s.customDecals)
  const stickersById = useDecalsById(customDecals)
  const prepared = usePreparedHand(skinTone, variant?.shape, variant?.length)
  const debugMode = useStudioStore((s) => s.debugMode)
  // User lighting ("Ánh sáng" panel) only applies to the interactive Studio canvas —
  // Home/Library preview instances of HandCanvas stay on DEFAULT_LIGHT regardless of what
  // the user last set in Studio, since those are marketing surfaces, not the editable design.
  const lightExposure = useStudioStore((s) => s.lightExposure)
  const lightStrength = useStudioStore((s) => s.lightStrength)
  const lightAngleDeg = useStudioStore((s) => s.lightAngleDeg)
  const light: LightState = useMemo(
    () => (interactive ? { ...DEFAULT_LIGHT, exposure: lightExposure, strength: lightStrength, angle: lightAngleDeg } : DEFAULT_LIGHT),
    [interactive, lightExposure, lightStrength, lightAngleDeg],
  )
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [debugPointer, setDebugPointer] = useState<{ img: [number, number]; nailId: FingerId | null; uv: [number, number] | null } | null>(null)
  // Namespaces every <defs> id/url(#...) reference so multiple HandCanvas
  // instances on one page (Library grid, Home suggestions) never collide on
  // ids like "clip-real-thumb" — url(#...) resolution across duplicate ids
  // in one document is undefined behavior.
  const iid = useId()

  const presetsById = useMemo(() => Object.fromEntries(presets.map((p) => [p.id, p])), [presets])
  const [liveDrag, setLiveDrag] = useState<LiveDragOverride | null>(null)
  const [liveStroke, setLiveStroke] = useState<{ finger: FingerId; points: [number, number][] } | null>(null)

  const startStroke = (nail: NailCoord, e: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return
    const point = clientToSvgPoint(svg, e.clientX, e.clientY)
    if (!point) return
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // Some input sources (synthetic events, certain touch/pen edge cases) don't have an
      // active pointer to capture — the stroke still works via bubbled pointermove/pointerup.
    }
    setLiveStroke({ finger: nail.id, points: [imageToLocal(nail, point)] })
  }

  const continueStroke = (nail: NailCoord, e: React.PointerEvent) => {
    if (!liveStroke || liveStroke.finger !== nail.id) return
    const svg = svgRef.current
    if (!svg) return
    const point = clientToSvgPoint(svg, e.clientX, e.clientY)
    if (!point) return
    setLiveStroke((s) => (s ? { ...s, points: [...s.points, imageToLocal(nail, point)] } : s))
  }

  const endStroke = () => {
    if (liveStroke && liveStroke.points.length > 1) onAddStroke?.(liveStroke.finger, liveStroke.points)
    setLiveStroke(null)
  }

  // Clicking anywhere outside this HandCanvas entirely (e.g. the tool panel beside it)
  // also deselects the sticker — the in-canvas paths handle clicks that land on the nail
  // itself, but a click that never reaches this component at all needs its own listener.
  useEffect(() => {
    if (!interactive || !selectedStickerInstance) return
    function handleOutsidePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onSelectSticker?.(null)
      }
    }
    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [interactive, selectedStickerInstance, onSelectSticker])

  const ready = hand && !handLoading && !presetsLoading && prepared

  if (!ready) {
    return (
      <div className={`relative aspect-[1024/1536] w-full overflow-hidden rounded-[2rem] bg-white/60 ${className}`}>
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.7)_50%,transparent_70%)] bg-[length:200%_100%]" />
        <div className="absolute inset-0 flex items-center justify-center text-vibe-ink-soft/60 text-sm">Đang tải studio…</div>
      </div>
    )
  }

  const showDebug = interactive && debugMode

  const handleDebugPointerMove = (e: React.PointerEvent) => {
    if (!showDebug || !svgRef.current) return
    const point = clientToSvgPoint(svgRef.current, e.clientX, e.clientY)
    if (!point) return
    let nailId: FingerId | null = null
    for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
      const id = (el as HTMLElement).dataset?.nailId
      if (id) {
        nailId = id as FingerId
        break
      }
    }
    const nail = nailId ? hand.nails.find((n) => n.id === nailId) ?? null : null
    const uv = nail ? imageToLocal(nail, point) : null
    setDebugPointer({ img: point, nailId, uv })
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[1024/1536] w-full select-none ${className}`}
      onPointerMove={handleDebugPointerMove}
      onPointerLeave={() => setDebugPointer(null)}
    >
      <img
        src={handBaseUrl(skinTone, variant?.shape, variant?.length)}
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
            iid={iid}
            skinTone={skinTone}
            photoShape={variant?.shape}
            photoLength={variant?.length}
            light={light}
            liveDrag={liveDrag && liveDrag.finger === nail.id ? liveDrag : null}
          />
        ))}
        <CharmLayer hand={hand} fingers={fingers} stickersById={stickersById} light={light} liveDrag={liveDrag} />
        {liveDrag && (
          <TransientStickerPreview
            nail={hand.nails.find((n) => n.id === liveDrag.finger)!}
            instanceId={liveDrag.instanceId}
            patch={liveDrag.patch}
            design={fingers[liveDrag.finger]}
            stickersById={stickersById}
          />
        )}
        {interactive &&
          hand.nails.map((nail) => (
            <path
              key={`hit-${nail.id}`}
              d={nail.path}
              data-nail-id={nail.id}
              fill="transparent"
              className={drawMode ? 'cursor-crosshair' : 'cursor-pointer'}
              onPointerDown={(e) => {
                e.stopPropagation()
                onSelectFinger?.(nail.id)
                if (drawMode) {
                  startStroke(nail, e)
                  return
                }
                // Tapping empty nail area (not the sticker/gizmo itself, which is drawn on
                // top and would have already stopped this event) also deselects — otherwise
                // a sticker's gizmo handles stay stuck on screen after the user taps away,
                // covering the design they're trying to look at.
                onSelectSticker?.(null)
              }}
              onPointerMove={drawMode ? (e) => continueStroke(nail, e) : undefined}
              onPointerUp={drawMode ? endStroke : undefined}
              onPointerCancel={drawMode ? endStroke : undefined}
            />
          ))}
        {drawMode && liveStroke && liveStroke.points.length > 1 && (
          <g clipPath={`url(#clip-real-${iid}-${liveStroke.finger})`} pointerEvents="none">
            <path
              d={strokePathD(hand.nails.find((n) => n.id === liveStroke.finger)!, liveStroke.points)}
              fill="none"
              stroke={brushColor}
              strokeWidth={brushWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
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
            onLiveDrag={(instanceId, patch) => setLiveDrag(patch ? { finger: selectedFinger, instanceId, patch } : null)}
          />
        )}
        {showDebug && <DebugOverlaySvg hand={hand} fingers={fingers} stickersById={stickersById} />}
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
      {showDebug && <DebugReadout pointer={debugPointer} />}
      {showDebug && selectedFinger && (
        <DebugViewsPanel
          finger={selectedFinger}
          prepared={prepared!.get(selectedFinger)}
          design={fingers[selectedFinger]}
          preset={presetsById[fingers[selectedFinger].presetId]}
        />
      )}
    </div>
  )
}

/** Dashed outline of every real nail.path + always-visible bounding boxes (with corner
 * coordinates) for every decal instance — QA-only, toggled via the Debug button. */
function DebugOverlaySvg({
  hand,
  fingers,
  stickersById,
}: {
  hand: NonNullable<ReturnType<typeof useHandData>['hand']>
  fingers: Record<FingerId, FingerDesign>
  stickersById: Record<string, DecalAsset>
}) {
  return (
    <g pointerEvents="none">
      {hand.nails.map((nail) => (
        <path key={`dbg-outline-${nail.id}`} d={nail.path} fill="none" stroke="#39ff88" strokeWidth={2} strokeDasharray="8 5" opacity={0.85} />
      ))}
      {hand.nails.map((nail) =>
        fingers[nail.id].stickers
          .filter((st) => st.visible !== false)
          .map((st) => {
            const sticker = stickersById[st.stickerId]
            if (!sticker) return null
            const [cx, cy] = localToImage(nail, st.uv)
            // Square footprint approximation — the exact content-aspect box is drawn by the
            // real gizmo when selected; this overlay only needs to show approximate bounds
            // + coordinates for every decal at once, without resolving each decal's pixels.
            const w = nailWidthPx(nail) * sticker.defaultScale * st.scale
            const h = w
            const hw = w / 2
            const hh = h / 2
            const corners: [number, number][] = [
              [-hw, -hh],
              [hw, -hh],
              [hw, hh],
              [-hw, hh],
            ].map(([dx, dy]) => rotatePointDeg(dx, dy, st.rotation)) as [number, number][]
            return (
              <g key={`dbg-decal-${st.instanceId}`}>
                <rect
                  x={-hw}
                  y={-hh}
                  width={w}
                  height={h}
                  transform={`translate(${cx} ${cy}) rotate(${st.rotation})`}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                />
                {corners.map(([dx, dy], i) => (
                  <text key={i} x={cx + dx} y={cy + dy} fontSize={11} fill="#0891b2" style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 2 }}>
                    {Math.round(cx + dx)},{Math.round(cy + dy)}
                  </text>
                ))}
              </g>
            )
          }),
      )}
    </g>
  )
}

function DebugReadout({ pointer }: { pointer: { img: [number, number]; nailId: FingerId | null; uv: [number, number] | null } | null }) {
  if (!pointer) return null
  const [ix, iy] = pointer.img
  return (
    <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-black/80 px-2.5 py-1.5 font-mono text-[10px] leading-tight text-lime-300">
      <div>image: {ix.toFixed(1)}, {iy.toFixed(1)}</div>
      <div>finger: {pointer.nailId ?? '—'}</div>
      <div>uv: {pointer.uv ? `${pointer.uv[0].toFixed(3)}, ${pointer.uv[1].toFixed(3)}` : '—'}</div>
    </div>
  )
}

const DEBUG_VIEW_MODES: { mode: DebugViewMode; label: string }[] = [
  { mode: 'normal', label: 'Normal' },
  { mode: 'roughness', label: 'Roughness' },
  { mode: 'fresnel', label: 'Fresnel' },
  { mode: 'curve', label: 'Curvature' },
  { mode: 'edge', label: 'Edge' },
]

/** Diagnostic proof that macro/micro normal, per-pixel roughness and Fresnel actually
 * drive the render, not just the final lit composite — see Phase 1R in the plan. */
function DebugViewsPanel({
  finger,
  prepared,
  design,
  preset,
}: {
  finger: FingerId
  prepared: PreparedNail | undefined
  design: FingerDesign
  preset: ReturnType<typeof useColorPresets>['presets'][number] | undefined
}) {
  const materialCfg = useMemo(() => (preset ? buildMaterialConfig(preset, design.effect) : null), [preset, design.effect])
  const seed = useMemo(() => FINGER_ORDER.indexOf(finger), [finger])
  const urls = useMemo(() => {
    if (!prepared || !materialCfg) return null
    return Object.fromEntries(DEBUG_VIEW_MODES.map(({ mode }) => [mode, renderDebugView(prepared, materialCfg, mode, seed).toDataURL()]))
  }, [prepared, materialCfg, seed])

  if (!urls) return null

  return (
    <div className="pointer-events-none absolute bottom-2 left-2 flex gap-2 rounded-xl bg-black/70 p-2">
      {DEBUG_VIEW_MODES.map(({ mode, label }) => (
        <div key={mode} className="flex flex-col items-center gap-0.5">
          <img src={urls[mode]} alt={label} className="h-14 w-14 rounded bg-white/10 object-contain" />
          <span className="font-mono text-[9px] text-white/80">{label}</span>
        </div>
      ))}
    </div>
  )
}

function NailPaint({
  nail,
  design,
  preset,
  stickersById,
  prepared,
  iid,
  skinTone,
  photoShape,
  photoLength,
  light,
  liveDrag,
}: {
  nail: NailCoord
  design: FingerDesign
  preset: ReturnType<typeof useColorPresets>['presets'][number] | undefined
  stickersById: Record<string, DecalAsset>
  prepared: PreparedNail | undefined
  iid: string
  skinTone: SkinToneId
  photoShape: NailShape | undefined
  photoLength: NailLength | undefined
  light: LightState
  liveDrag: LiveDragOverride | null
}) {
  const seed = useMemo(() => FINGER_ORDER.indexOf(nail.id), [nail.id])
  const paintCfg = useMemo(
    () => (preset ? buildPaintConfig(preset, design.customColor, design.customGradient) : null),
    [preset, design.customColor, design.customGradient],
  )
  const materialCfg = useMemo(() => (preset ? buildMaterialConfig(preset, design.effect) : null), [preset, design.effect])

  // Raised charms are excluded here — they render in the hand-level, unclipped CharmLayer
  // instead (see below), never baked into this per-nail canvas.
  const sortedStickers = useMemo(
    () => [...design.stickers].filter((st) => stickersById[st.stickerId]?.layerType !== 'raised').sort((a, b) => a.z - b.z),
    [design.stickers, stickersById],
  )
  const stickerUrls = useMemo(() => {
    const urls: string[] = []
    for (const st of sortedStickers) {
      const sticker = stickersById[st.stickerId]
      if (sticker) urls.push(resolveDecalPath(sticker.path))
    }
    return urls
  }, [sortedStickers, stickersById])
  const resolvedAssets = useResolvedDecalAssets(stickerUrls)

  // Decals are baked directly into the lit raster below (curvature-warped, shaded,
  // and glossed over by the same clear-coat pass as the paint) instead of floating
  // above the photo as separate unlit <image> elements.
  // Only the *identity* of the actively-dragged sticker matters for exclusion — not its
  // constantly-changing live patch — so this memo doesn't recompute (and re-trigger the
  // expensive composeNail bake) on every pointermove, only when a drag starts or ends.
  const liveDragInstanceId = liveDrag?.instanceId ?? null
  const decalLayers = useMemo<DecalLayer[]>(() => {
    if (!prepared) return []
    const layers: DecalLayer[] = []
    for (const st of sortedStickers) {
      if (liveDragInstanceId === st.instanceId) continue // shown as a transient preview instead
      if (st.visible === false) continue
      const sticker = stickersById[st.stickerId]
      if (!sticker) continue
      const url = resolveDecalPath(sticker.path)
      const resolved = resolvedAssets.get(url)
      if (!resolved) continue
      const [cx, cy] = localToImage(nail, st.uv)
      const widthPx = nailWidthPx(nail) * sticker.defaultScale * st.scale
      const [, , cbw, cbh] = resolved.contentBounds
      const contentAspect = (cbh * resolved.pixels.height) / (cbw * resolved.pixels.width || 1)
      layers.push({
        pixels: resolved.pixels,
        contentBounds: resolved.contentBounds,
        centerX: cx,
        centerY: cy,
        widthPx,
        heightPx: widthPx * contentAspect,
        rotationDeg: st.rotation,
        flipX: st.flipX ?? false,
        opacity: st.opacity ?? 1,
        tint: sticker.tintable && st.tint ? hexToRgb01(st.tint) : null,
        curvature: 0.55,
        layerType: sticker.layerType === 'raised' ? 'raised' : sticker.layerType,
      })
    }
    return layers
  }, [prepared, sortedStickers, stickersById, resolvedAssets, nail, liveDragInstanceId])

  const dataUrl = useMemo(() => {
    if (!prepared || !paintCfg || !materialCfg) return null
    return composeNail(prepared, paintCfg, materialCfg, decalLayers, light, seed).toDataURL()
  }, [prepared, paintCfg, materialCfg, decalLayers, light, seed])

  if (!preset || !prepared || !dataUrl) return null
  const uid = `${iid}-${nail.id}`
  const trimUv = shapeTrimUv(design.shape)
  const lengthMatrix = lengthScaleMatrix(nail, LENGTH_SCALE[design.length])
  // Must match the growPx nailLighting.ts used to pad/grow its raster buffer
  // (nailEdgeTuning.ts is the single source of truth for both) — otherwise the extra
  // painted pixels from that growth would just be clipped away here, back down to the
  // original traced path. The stroke below dilates the silhouette by a true isotropic
  // pixel distance along the path's own local normal — a centroid-scaled transform was
  // tried first but over/under-grows anisotropically on a rotated or elongated nail
  // (visible on the thumb, which sits at a real angle in the photo).
  const growPx = maskGrowPxFor(skinTone, nail.id, photoShape, photoLength)

  return (
    <g pointerEvents="none">
      <defs>
        <clipPath id={`clip-real-${uid}`}>
          <path d={nail.path} />
          {growPx > 0 && <path d={nail.path} fill="none" stroke="white" strokeWidth={growPx * 2} strokeLinejoin="round" />}
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
          {design.drawStrokes.map((stroke) => (
            <path
              key={stroke.id}
              d={strokePathD(nail, stroke.points)}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </g>
    </g>
  )
}

/**
 * Every `raised` charm across the WHOLE hand, composited on one shared, unclipped
 * overlay canvas (see composeCharmLayer) — a charm is a small object accessory, not paint
 * on the nail surface, so unlike flat/foil decals (baked per-nail inside NailPaint above,
 * clipped to that nail's own silhouette) it must be free to overflow the nail edge or sit
 * partly on finger skin instead of being hard-clipped at a per-nail canvas's own bounds.
 */
function CharmLayer({
  hand,
  fingers,
  stickersById,
  light,
  liveDrag,
}: {
  hand: NonNullable<ReturnType<typeof useHandData>['hand']>
  fingers: Record<FingerId, FingerDesign>
  stickersById: Record<string, DecalAsset>
  light: LightState
  liveDrag: LiveDragOverride | null
}) {
  const charmInstances = useMemo(() => {
    const list: { nail: NailCoord; st: StickerInstance }[] = []
    for (const nail of hand.nails) {
      for (const st of fingers[nail.id].stickers) {
        if (st.visible === false) continue
        const asset = stickersById[st.stickerId]
        if (!asset || asset.layerType !== 'raised') continue
        if (liveDrag && liveDrag.finger === nail.id && liveDrag.instanceId === st.instanceId) continue // shown as a transient preview instead
        list.push({ nail, st })
      }
    }
    return list
  }, [hand, fingers, stickersById, liveDrag])

  const urls = useMemo(() => charmInstances.map(({ st }) => resolveDecalPath(stickersById[st.stickerId].path)), [charmInstances, stickersById])
  const resolvedAssets = useResolvedDecalAssets(urls)

  const charmLayers = useMemo<DecalLayer[]>(() => {
    const layers: DecalLayer[] = []
    for (const { nail, st } of charmInstances) {
      const sticker = stickersById[st.stickerId]
      const url = resolveDecalPath(sticker.path)
      const resolved = resolvedAssets.get(url)
      if (!resolved) continue
      const [cx, cy] = localToImage(nail, st.uv)
      const widthPx = nailWidthPx(nail) * sticker.defaultScale * st.scale
      const [, , cbw, cbh] = resolved.contentBounds
      const contentAspect = (cbh * resolved.pixels.height) / (cbw * resolved.pixels.width || 1)
      layers.push({
        pixels: resolved.pixels,
        contentBounds: resolved.contentBounds,
        centerX: cx,
        centerY: cy,
        widthPx,
        heightPx: widthPx * contentAspect,
        rotationDeg: st.rotation,
        flipX: st.flipX ?? false,
        opacity: st.opacity ?? 1,
        tint: sticker.tintable && st.tint ? hexToRgb01(st.tint) : null,
        curvature: 0,
        layerType: 'raised',
      })
    }
    return layers
  }, [charmInstances, stickersById, resolvedAssets])

  const dataUrl = useMemo(
    () => (charmLayers.length ? composeCharmLayer(charmLayers, light, hand.width, hand.height).toDataURL() : null),
    [charmLayers, light, hand.width, hand.height],
  )

  if (!dataUrl) return null
  return (
    <g pointerEvents="none">
      <image href={dataUrl} x={0} y={0} width={hand.width} height={hand.height} />
    </g>
  )
}

/**
 * Cheap, flat, unlit preview of the one sticker currently being dragged —
 * intentionally NOT run through the lit compositor (see the perf note on
 * LiveDragOverride above). Swapped for the real curvature-warped, lit decal
 * the moment the drag ends.
 */
function TransientStickerPreview({
  nail,
  instanceId,
  patch,
  design,
  stickersById,
}: {
  nail: NailCoord
  instanceId: string
  patch: Partial<StickerInstance>
  design: FingerDesign
  stickersById: Record<string, DecalAsset>
}) {
  const base = design.stickers.find((st) => st.instanceId === instanceId)
  if (!base) return null
  const instance = { ...base, ...patch }
  const sticker = stickersById[instance.stickerId]
  if (!sticker) return null
  const [cx, cy] = localToImage(nail, instance.uv)
  const size = nailWidthPx(nail) * sticker.defaultScale * instance.scale
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${instance.rotation}) scale(${instance.flipX ? -1 : 1}, 1)`} opacity={(instance.opacity ?? 1) * 0.92}>
      <image href={resolveDecalPath(sticker.path)} x={-size / 2} y={-size / 2} width={size} height={size} preserveAspectRatio="xMidYMid meet" />
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
  onLiveDrag,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  nail: NailCoord
  stickers: StickerInstance[]
  stickersById: Record<string, DecalAsset>
  selectedId: string | null
  onSelect: (id: string | null) => void
  onUpdate: (instanceId: string, patch: Partial<StickerInstance>) => void
  onRemove: (instanceId: string) => void
  onDuplicate: (instanceId: string) => void
  onLiveDrag: (instanceId: string, patch: Partial<StickerInstance> | null) => void
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
          onLiveDrag={(patch) => onLiveDrag(instance.instanceId, patch)}
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
  onLiveDrag,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  nail: NailCoord
  instance: StickerInstance
  sticker: DecalAsset | undefined
  selected: boolean
  onSelect: () => void
  onUpdate: (patch: Partial<StickerInstance>) => void
  onRemove: () => void
  onDuplicate: () => void
  onLiveDrag: (patch: Partial<StickerInstance> | null) => void
}) {
  const [mode, setMode] = useState<GizmoMode>(null)
  // Local-only while dragging: the gizmo's own handles track this immediately, but the
  // expensive lit re-composite (via onUpdate -> the store) only fires once, on release —
  // see the LiveDragOverride perf note in HandCanvas.
  const [livePatch, setLivePatch] = useState<Partial<StickerInstance> | null>(null)
  const dragInfo = useRef<{ startAngleOffset: number; baseSize: number; moveOffset: [number, number] }>({
    startAngleOffset: 0,
    baseSize: 1,
    moveOffset: [0, 0],
  })

  if (!sticker) return null

  const effective = livePatch ? { ...instance, ...livePatch } : instance
  const [cx, cy] = localToImage(nail, effective.uv)
  const baseSize = nailWidthPx(nail) * sticker.defaultScale
  const size = baseSize * effective.scale
  const hs = size / 2
  // Handles are sized in image-space units but the canvas renders far smaller than
  // its 1024px-wide viewBox (e.g. ~340px in the studio), so a "visually right" handle
  // must be oversized here to still clear a touch target on screen — trimmed down from
  // the original sizing (which users found too large/obscuring) while staying tappable.
  const handleR = 38
  const scaleHandleHalf = 26
  const smallBtnR = 32

  const startDrag = (m: GizmoMode) => (e: React.PointerEvent) => {
    e.stopPropagation()
    onSelect()
    if (instance.locked) return
    const svg = svgRef.current
    if (!svg) return
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // No active pointer to capture (synthetic input, some pen/touch edge cases) — the
      // drag still works via bubbled pointermove/pointerup, just without outside-capture.
    }
    const point = clientToSvgPoint(svg, e.clientX, e.clientY)
    if (!point) return
    setMode(m)
    const [px, py] = point
    if (m === 'rotate') {
      const angleToPointer = (Math.atan2(py - cy, px - cx) * 180) / Math.PI
      dragInfo.current.startAngleOffset = effective.rotation - angleToPointer
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
    const point = clientToSvgPoint(svg, e.clientX, e.clientY)
    if (!point) return
    const [px, py] = point
    let patch: Partial<StickerInstance> | null = null
    if (mode === 'move') {
      const [ox, oy] = dragInfo.current.moveOffset
      const uv = imageToLocal(nail, [px + ox, py + oy])
      // A charm is a small object accessory, not paint on the nail surface — it may be
      // placed on the nail edge, near the cuticle, or on the finger itself, so its
      // placement range is much wider than a flat sticker's (which stays close to the
      // nail so it always renders as "on the nail surface", per the sticker/charm
      // rendering split — see CharmLayer/composeCharmLayer in nailFill.ts).
      const isCharm = sticker?.layerType === 'raised'
      const clamped: [number, number] = isCharm
        ? [Math.min(2.5, Math.max(-1.5, uv[0])), Math.min(3, Math.max(-1.5, uv[1]))]
        : [Math.min(1.2, Math.max(-0.2, uv[0])), Math.min(1.25, Math.max(-0.2, uv[1]))]
      patch = { uv: clamped }
    } else if (mode === 'rotate') {
      const angle = (Math.atan2(py - cy, px - cx) * 180) / Math.PI
      patch = { rotation: Math.round(angle + dragInfo.current.startAngleOffset) }
    } else if (mode === 'scale') {
      const dist = Math.hypot(px - cx, py - cy)
      const restDist = (dragInfo.current.baseSize / 2) * Math.SQRT2
      const scale = Math.min(2.6, Math.max(0.35, dist / restDist))
      patch = { scale }
    }
    if (patch) {
      setLivePatch(patch)
      onLiveDrag(patch)
    }
  }

  const endDrag = () => {
    setMode(null)
    if (livePatch) onUpdate(livePatch)
    setLivePatch(null)
    onLiveDrag(null)
  }

  const [scaleDx, scaleDy] = rotatePointDeg(hs, hs, effective.rotation)
  const [rotDx, rotDy] = rotatePointDeg(0, -hs - handleR - 14, effective.rotation)
  const [delDx, delDy] = rotatePointDeg(hs, -hs, effective.rotation)
  const [dupDx, dupDy] = rotatePointDeg(-hs, -hs, effective.rotation)

  return (
    <g>
      <rect
        x={-hs}
        y={-hs}
        width={size}
        height={size}
        transform={`translate(${cx} ${cy}) rotate(${effective.rotation})`}
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

          {!instance.locked && (
            <g transform={`translate(${cx + delDx} ${cy + delDy})`} onPointerDown={(e) => { e.stopPropagation(); onRemove() }} className="cursor-pointer">
              <circle r={smallBtnR} fill="white" stroke="#e5484d" strokeWidth={4} />
              <X x={-smallBtnR * 0.5} y={-smallBtnR * 0.5} width={smallBtnR} height={smallBtnR} color="#e5484d" strokeWidth={3} />
            </g>
          )}

          <g transform={`translate(${cx + dupDx} ${cy + dupDy})`} onPointerDown={(e) => { e.stopPropagation(); onDuplicate() }} className="cursor-pointer">
            <circle r={smallBtnR} fill="white" stroke="var(--color-vibe-yellow-dark)" strokeWidth={4} />
            <Copy x={-smallBtnR * 0.45} y={-smallBtnR * 0.45} width={smallBtnR * 0.9} height={smallBtnR * 0.9} color="#c98a1f" strokeWidth={2.6} />
          </g>
        </>
      )}
    </g>
  )
}
