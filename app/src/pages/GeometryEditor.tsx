import {
  ChevronLeft,
  Clipboard,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Focus,
  Grid3X3,
  Hand,
  ImagePlus,
  Maximize2,
  MousePointer2,
  Move,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { handBaseUrl, getHandData } from '@/data/loaders'
import {
  nearestSegmentIndex,
  parsePathPoints,
  pointsForHand,
  rebuildNail,
  replaceNailGeometry,
  rotateAxis,
  smoothClosedPath,
  transformPoints,
  validateHandData,
  type GeometryPoint,
} from '@/lib/geometryEditor'
import {
  FINGER_LABEL_VI,
  FINGER_ORDER,
  SHAPE_LABEL_VI,
  type FingerId,
  type HandData,
  type NailLength,
  type NailShape,
  type SkinToneId,
} from '@/types/vibeu'

type ToolMode = 'points' | 'move' | 'pan'

interface ViewState {
  centerX: number
  centerY: number
  zoom: number
}

interface TransformForm {
  dx: string
  dy: string
  scaleX: string
  scaleY: string
  rotation: string
}

type DragState =
  | {
      kind: 'point' | 'shape'
      pointerId: number
      finger: FingerId
      pointIndex?: number
      start: GeometryPoint
      sourcePoints: GeometryPoint[]
      before: HandData
      changed: boolean
    }
  | {
      kind: 'pan'
      pointerId: number
      startClient: GeometryPoint
      sourceView: ViewState
    }

const SHAPES: NailShape[] = ['oval', 'square', 'coffin', 'almond']
const LENGTHS: NailLength[] = ['S', 'M', 'L']
const TONES: { id: SkinToneId; label: string }[] = [
  { id: 'cozy', label: 'Da sáng' },
  { id: 'matcha', label: 'Da ấm' },
]
const FINGER_COLORS: Record<FingerId, string> = {
  thumb: '#ff48d7',
  index: '#49d9ff',
  middle: '#ffe04b',
  ring: '#62f493',
  little: '#ad72ff',
}
const EMPTY_TRANSFORM: TransformForm = { dx: '0', dy: '0', scaleX: '100', scaleY: '100', rotation: '0' }

function cloneHand(hand: HandData): HandData {
  return structuredClone(hand)
}

function variantKey(tone: SkinToneId, shape: NailShape, length: NailLength) {
  return `${tone}:${shape}-${length}`
}

function destinationPath(tone: SkinToneId, shape: NailShape, length: NailLength) {
  if (shape === 'oval' && length === 'M') return `public/assets/hands/${tone}/coordinates.json`
  return `public/assets/hands/${tone}/variants/${shape}-${length}/coordinates.json`
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function Field({
  label,
  value,
  onChange,
  step = '0.1',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  step?: string
}) {
  return (
    <label className="space-y-1 text-[11px] font-semibold text-slate-500">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
      />
    </label>
  )
}

function ToolButton({
  active = false,
  disabled = false,
  title,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  title: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-10 min-w-10 place-items-center rounded-xl border px-2 transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'border-fuchsia-500 bg-fuchsia-500 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-fuchsia-300 hover:text-fuchsia-600'
      }`}
    >
      {children}
    </button>
  )
}

export default function GeometryEditor() {
  const [tone, setTone] = useState<SkinToneId>('cozy')
  const [shape, setShape] = useState<NailShape>('oval')
  const [length, setLength] = useState<NailLength>('S')
  const [hand, setHand] = useState<HandData | null>(null)
  const [baseline, setBaseline] = useState<HandData | null>(null)
  const [selectedFinger, setSelectedFinger] = useState<FingerId>('thumb')
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [tool, setTool] = useState<ToolMode>('points')
  const [view, setView] = useState<ViewState>({ centerX: 512, centerY: 768, zoom: 1 })
  const [past, setPast] = useState<HandData[]>([])
  const [future, setFuture] = useState<HandData[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [overlayOpacity, setOverlayOpacity] = useState(42)
  const [showAll, setShowAll] = useState(true)
  const [showNodes, setShowNodes] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [snap, setSnap] = useState('0.5')
  const [transform, setTransform] = useState<TransformForm>(EMPTY_TRANSFORM)
  const [smoothStrength, setSmoothStrength] = useState('2')
  const [customImage, setCustomImage] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const key = variantKey(tone, shape, length)
  const imageUrl = customImage ?? handBaseUrl(tone, shape, length)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setMessage('')
    setCustomImage(null)
    getHandData(tone, shape, length)
      .then((loaded) => {
        if (!alive) return
        const clean = cloneHand(loaded)
        const draft = localStorage.getItem(`vibeu-geometry:${key}`)
        let working = clean
        if (draft) {
          try {
            working = validateHandData(JSON.parse(draft))
            setMessage('Đã khôi phục bản nháp trên trình duyệt.')
          } catch {
            localStorage.removeItem(`vibeu-geometry:${key}`)
          }
        }
        setBaseline(clean)
        setHand(cloneHand(working))
        setPast([])
        setFuture([])
        setSelectedPoint(null)
        setView({ centerX: clean.width / 2, centerY: clean.height / 2, zoom: 1 })
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
        setMessage('Không tải được ảnh hoặc coordinates.json của tổ hợp này.')
      })
    return () => {
      alive = false
    }
  }, [key, length, shape, tone])

  const points = useMemo(() => (hand ? pointsForHand(hand) : null), [hand])
  const selectedNail = hand?.nails.find((nail) => nail.id === selectedFinger) ?? null
  const selectedPoints = points?.[selectedFinger] ?? []

  const viewBox = useMemo(() => {
    if (!hand) return '0 0 1024 1536'
    const width = hand.width / view.zoom
    const height = hand.height / view.zoom
    return `${view.centerX - width / 2} ${view.centerY - height / 2} ${width} ${height}`
  }, [hand, view])

  const pushChange = useCallback(
    (next: HandData) => {
      if (!hand) return
      setPast((items) => [...items, cloneHand(hand)].slice(-100))
      setFuture([])
      setHand(next)
    },
    [hand],
  )

  const undo = useCallback(() => {
    if (!hand || !past.length) return
    const previous = past[past.length - 1]
    setPast((items) => items.slice(0, -1))
    setFuture((items) => [cloneHand(hand), ...items].slice(0, 100))
    setHand(cloneHand(previous))
    setSelectedPoint(null)
  }, [hand, past])

  const redo = useCallback(() => {
    if (!hand || !future.length) return
    const next = future[0]
    setPast((items) => [...items, cloneHand(hand)].slice(-100))
    setFuture((items) => items.slice(1))
    setHand(cloneHand(next))
    setSelectedPoint(null)
  }, [future, hand])

  const clientToImage = useCallback(
    (clientX: number, clientY: number): GeometryPoint => {
      const svg = svgRef.current
      if (!svg || !hand) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      const width = hand.width / view.zoom
      const height = hand.height / view.zoom
      return {
        x: view.centerX - width / 2 + ((clientX - rect.left) / rect.width) * width,
        y: view.centerY - height / 2 + ((clientY - rect.top) / rect.height) * height,
      }
    },
    [hand, view],
  )

  const quantize = useCallback(
    (value: number) => {
      const step = Number(snap)
      return step > 0 ? Math.round(value / step) * step : value
    },
    [snap],
  )

  const beginPointDrag = (event: React.PointerEvent, finger: FingerId, pointIndex: number) => {
    if (!hand || !points) return
    event.stopPropagation()
    setSelectedFinger(finger)
    setSelectedPoint(pointIndex)
    setTool('points')
    svgRef.current?.setPointerCapture(event.pointerId)
    dragRef.current = {
      kind: 'point',
      pointerId: event.pointerId,
      finger,
      pointIndex,
      start: clientToImage(event.clientX, event.clientY),
      sourcePoints: points[finger].map((point) => ({ ...point })),
      before: cloneHand(hand),
      changed: false,
    }
  }

  const beginShapeDrag = (event: React.PointerEvent, finger: FingerId) => {
    if (!hand || !points) return
    event.stopPropagation()
    setSelectedFinger(finger)
    setSelectedPoint(null)
    if (tool !== 'move') return
    svgRef.current?.setPointerCapture(event.pointerId)
    dragRef.current = {
      kind: 'shape',
      pointerId: event.pointerId,
      finger,
      start: clientToImage(event.clientX, event.clientY),
      sourcePoints: points[finger].map((point) => ({ ...point })),
      before: cloneHand(hand),
      changed: false,
    }
  }

  const beginPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.button !== 1) return
    if (tool !== 'pan' && event.button !== 1 && !event.altKey) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      kind: 'pan',
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      sourceView: view,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || !hand) return
    if (drag.kind === 'pan') {
      const rect = event.currentTarget.getBoundingClientRect()
      const scaleX = hand.width / drag.sourceView.zoom / rect.width
      const scaleY = hand.height / drag.sourceView.zoom / rect.height
      setView({
        ...drag.sourceView,
        centerX: drag.sourceView.centerX - (event.clientX - drag.startClient.x) * scaleX,
        centerY: drag.sourceView.centerY - (event.clientY - drag.startClient.y) * scaleY,
      })
      return
    }
    const current = clientToImage(event.clientX, event.clientY)
    const dx = current.x - drag.start.x
    const dy = current.y - drag.start.y
    const nextPoints = drag.sourcePoints.map((point, index) => {
      if (drag.kind === 'point' && index !== drag.pointIndex) return point
      return { x: quantize(point.x + dx), y: quantize(point.y + dy) }
    })
    const sourceNail = hand.nails.find((nail) => nail.id === drag.finger)
    if (!sourceNail) return
    setHand((currentHand) => (currentHand ? replaceNailGeometry(currentHand, drag.finger, nextPoints) : currentHand))
    drag.changed = true
  }

  const finishDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.kind !== 'pan' && drag.changed) {
      setPast((items) => [...items, drag.before].slice(-100))
      setFuture([])
    }
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const addPointAt = (event: React.MouseEvent<SVGPolygonElement>, finger: FingerId) => {
    if (!hand || !points || tool !== 'points') return
    event.stopPropagation()
    const point = clientToImage(event.clientX, event.clientY)
    const index = nearestSegmentIndex(points[finger], point)
    const nextPoints = [...points[finger]]
    nextPoints.splice(index + 1, 0, { x: quantize(point.x), y: quantize(point.y) })
    pushChange(replaceNailGeometry(hand, finger, nextPoints))
    setSelectedFinger(finger)
    setSelectedPoint(index + 1)
  }

  const addMidpoint = () => {
    if (!hand || !selectedPoints.length) return
    const index = selectedPoint ?? selectedPoints.length - 1
    const start = selectedPoints[index]
    const end = selectedPoints[(index + 1) % selectedPoints.length]
    const next = [...selectedPoints]
    next.splice(index + 1, 0, { x: quantize((start.x + end.x) / 2), y: quantize((start.y + end.y) / 2) })
    pushChange(replaceNailGeometry(hand, selectedFinger, next))
    setSelectedPoint(index + 1)
  }

  const deletePoint = () => {
    if (!hand || selectedPoint == null || selectedPoints.length <= 3) return
    const next = selectedPoints.filter((_, index) => index !== selectedPoint)
    pushChange(replaceNailGeometry(hand, selectedFinger, next))
    setSelectedPoint(Math.min(selectedPoint, next.length - 1))
  }

  const updateSelectedPoint = (axis: 'x' | 'y', value: string) => {
    if (!hand || selectedPoint == null || !Number.isFinite(Number(value))) return
    const next = selectedPoints.map((point, index) =>
      index === selectedPoint ? { ...point, [axis]: Number(value) } : point,
    )
    pushChange(replaceNailGeometry(hand, selectedFinger, next))
  }

  const applyTransform = () => {
    if (!hand || !selectedNail) return
    const rotation = Number(transform.rotation) || 0
    const nextPoints = transformPoints(selectedPoints, {
      dx: Number(transform.dx) || 0,
      dy: Number(transform.dy) || 0,
      scaleX: (Number(transform.scaleX) || 100) / 100,
      scaleY: (Number(transform.scaleY) || 100) / 100,
      rotation,
    }, selectedNail.axis).map((point) => ({ x: quantize(point.x), y: quantize(point.y) }))
    pushChange(replaceNailGeometry(hand, selectedFinger, nextPoints, rotateAxis(selectedNail.axis, rotation)))
    setTransform(EMPTY_TRANSFORM)
  }

  const smoothFinger = () => {
    if (!hand) return
    const nextPoints = smoothClosedPath(selectedPoints, Number(smoothStrength) || 2)
      .map((point) => ({ x: Number(point.x.toFixed(1)), y: Number(point.y.toFixed(1)) }))
    pushChange(replaceNailGeometry(hand, selectedFinger, nextPoints))
    setSelectedPoint(null)
    setMessage(`Đã làm mượt ${FINGER_LABEL_VI[selectedFinger]} ở mức ${smoothStrength}, giữ nguyên tâm và diện tích.`)
  }

  const smoothAllFingers = () => {
    if (!hand || !points) return
    let next = hand
    for (const finger of FINGER_ORDER) {
      const smoothed = smoothClosedPath(points[finger], Number(smoothStrength) || 2)
        .map((point) => ({ x: Number(point.x.toFixed(1)), y: Number(point.y.toFixed(1)) }))
      next = replaceNailGeometry(next, finger, smoothed)
    }
    pushChange(next)
    setSelectedPoint(null)
    setMessage(`Đã làm mượt cả 5 móng ở mức ${smoothStrength}, giữ nguyên tâm và diện tích.`)
  }

  const setAxis = (index: 0 | 1, value: string) => {
    if (!hand || !selectedNail || !Number.isFinite(Number(value))) return
    const axis: [number, number] = [...selectedNail.axis]
    axis[index] = Number(value)
    const next = {
      ...hand,
      nails: hand.nails.map((nail) => (nail.id === selectedFinger ? rebuildNail(nail, selectedPoints, axis) : nail)),
    }
    pushChange(next)
  }

  const fitHand = () => {
    if (!hand) return
    setView({ centerX: hand.width / 2, centerY: hand.height / 2, zoom: 1 })
  }

  const focusNail = () => {
    if (!hand || !selectedNail) return
    const [x, y, width, height] = selectedNail.bbox
    const zoom = Math.max(1, Math.min(8, Math.min(hand.width / Math.max(width * 2.2, 1), hand.height / Math.max(height * 2.2, 1))))
    setView({ centerX: x + width / 2, centerY: y + height / 2, zoom })
  }

  const adjustZoom = (factor: number) => {
    setView((current) => ({ ...current, zoom: Math.max(0.5, Math.min(12, current.zoom * factor)) }))
  }

  const saveDraft = () => {
    if (!hand) return
    localStorage.setItem(`vibeu-geometry:${key}`, JSON.stringify(hand))
    setMessage(`Đã lưu bản nháp ${key} trên trình duyệt.`)
  }

  const resetVariant = () => {
    if (!baseline) return
    if (!window.confirm('Khôi phục toàn bộ 5 móng về coordinates.json ban đầu của tổ hợp này?')) return
    pushChange(cloneHand(baseline))
    localStorage.removeItem(`vibeu-geometry:${key}`)
    setSelectedPoint(null)
    setMessage('Đã khôi phục geometry ban đầu.')
  }

  const exportCurrent = () => {
    if (!hand) return
    downloadJson(`${tone}-${shape}-${length}-coordinates.json`, hand)
    setMessage(`Đã xuất file dùng cho ${destinationPath(tone, shape, length)}.`)
  }

  const copyCurrent = async () => {
    if (!hand) return
    await navigator.clipboard.writeText(`${JSON.stringify(hand, null, 2)}\n`)
    setMessage('Đã sao chép toàn bộ coordinates.json vào clipboard.')
  }

  const importCoordinates = async (file: File) => {
    try {
      const imported = validateHandData(JSON.parse(await file.text()))
      if (hand && (imported.width !== hand.width || imported.height !== hand.height)) {
        const proceed = window.confirm(`Kích thước JSON là ${imported.width}×${imported.height}, khác ảnh hiện tại ${hand.width}×${hand.height}. Vẫn nhập?`)
        if (!proceed) return
      }
      if (hand) setPast((items) => [...items, cloneHand(hand)].slice(-100))
      setFuture([])
      setHand(cloneHand(imported))
      setMessage(`Đã nhập ${file.name}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được file JSON.')
    }
  }

  const importImage = (file: File) => {
    if (customImage) URL.revokeObjectURL(customImage)
    setCustomImage(URL.createObjectURL(file))
    setMessage(`Đang dùng ảnh tham chiếu ${file.name}; ảnh không được nhúng vào JSON.`)
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'SELECT' || target?.tagName === 'TEXTAREA') return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const shortcut: Partial<Record<string, ToolMode>> = { v: 'points', m: 'move', h: 'pan' }
        const nextTool = shortcut[event.key.toLowerCase()]
        if (nextTool) {
          event.preventDefault()
          setTool(nextTool)
          return
        }
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deletePoint()
        return
      }
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }
      if (!delta[event.key] || !hand) return
      event.preventDefault()
      const multiplier = event.shiftKey ? 10 : event.altKey ? 0.1 : 1
      const [dx, dy] = delta[event.key]
      const next = selectedPoints.map((point, index) => {
        if (selectedPoint != null && index !== selectedPoint) return point
        return { x: point.x + dx * multiplier, y: point.y + dy * multiplier }
      })
      pushChange(replaceNailGeometry(hand, selectedFinger, next))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [deletePoint, hand, pushChange, redo, selectedFinger, selectedPoint, selectedPoints, undo])

  const selectShape = (nextShape: NailShape) => {
    setShape(nextShape)
    if (nextShape === 'oval' && length === 'M') return
  }

  if (loading || !hand || !points) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-sm font-semibold text-white">Đang tải Geometry Editor…</div>
  }

  const nodeRadius = 7 / Math.sqrt(view.zoom)
  const strokeWidth = 2.4 / Math.sqrt(view.zoom)

  return (
    <div className="flex h-screen min-h-[720px] flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-slate-900 px-4">
        <div className="flex items-center gap-3">
          <Link to="/studio" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-fuchsia-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">Dev tool</span>
              <h1 className="text-base font-bold">VIBEU Nail Geometry Editor</h1>
            </div>
            <p className="text-xs text-slate-400">Chỉnh mask trực tiếp trên ảnh nguồn · xuất coordinates.json tương thích 100%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToolButton title="Hoàn tác (Ctrl+Z)" disabled={!past.length} onClick={undo}><Undo2 size={18} /></ToolButton>
          <ToolButton title="Làm lại (Ctrl+Y)" disabled={!future.length} onClick={redo}><Redo2 size={18} /></ToolButton>
          <button type="button" onClick={saveDraft} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold hover:bg-white/10">
            <Save size={17} /> Lưu nháp
          </button>
          <button type="button" onClick={exportCurrent} className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-fuchsia-500 px-4 text-sm font-bold text-white shadow-lg shadow-fuchsia-950/30 hover:brightness-110">
            <Download size={17} /> Xuất JSON
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="vibe-scrollbar w-[310px] shrink-0 overflow-y-auto border-r border-white/10 bg-slate-900 p-4">
          <section className="space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">1. Chọn ảnh bàn tay</div>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((item) => (
                <button key={item.id} type="button" onClick={() => setTone(item.id)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${tone === item.id ? 'border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs font-semibold text-slate-400">
                Form
                <select value={shape} onChange={(event) => selectShape(event.target.value as NailShape)} className="h-10 w-full rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white outline-none focus:border-fuchsia-400">
                  {SHAPES.map((item) => <option key={item} value={item}>{SHAPE_LABEL_VI[item]}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-400">
                Độ dài
                <select value={length} onChange={(event) => setLength(event.target.value as NailLength)} className="h-10 w-full rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white outline-none focus:border-fuchsia-400">
                  {LENGTHS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <button type="button" onClick={() => imageRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2.5 text-xs font-semibold text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200">
              <ImagePlus size={16} /> Dùng ảnh tham chiếu khác
            </button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && importImage(event.target.files[0])} />
          </section>

          <div className="my-5 h-px bg-white/10" />

          <section className="space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">2. Chọn ngón</div>
            <div className="space-y-1.5">
              {FINGER_ORDER.map((finger) => {
                const nail = hand.nails.find((item) => item.id === finger)!
                return (
                  <button key={finger} type="button" onClick={() => { setSelectedFinger(finger); setSelectedPoint(null) }} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${selectedFinger === finger ? 'border-fuchsia-400 bg-fuchsia-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: FINGER_COLORS[finger] }} />{FINGER_LABEL_VI[finger]}</span>
                    <span className="text-[10px] text-slate-500">{parsePathPoints(nail.path).length} điểm</span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="my-5 h-px bg-white/10" />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">3. Biến đổi ngón</div>
              <button type="button" onClick={() => setTransform(EMPTY_TRANSFORM)} className="text-[11px] font-semibold text-slate-500 hover:text-white">Xóa số</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Dịch X (px)" value={transform.dx} onChange={(value) => setTransform((current) => ({ ...current, dx: value }))} />
              <Field label="Dịch Y (px)" value={transform.dy} onChange={(value) => setTransform((current) => ({ ...current, dy: value }))} />
              <Field label="Rộng (%)" value={transform.scaleX} onChange={(value) => setTransform((current) => ({ ...current, scaleX: value }))} />
              <Field label="Dài (%)" value={transform.scaleY} onChange={(value) => setTransform((current) => ({ ...current, scaleY: value }))} />
              <div className="col-span-2"><Field label="Xoay (độ)" value={transform.rotation} onChange={(value) => setTransform((current) => ({ ...current, rotation: value }))} /></div>
            </div>
            <button type="button" onClick={applyTransform} className="w-full rounded-xl bg-white py-2.5 text-sm font-bold text-slate-900 hover:bg-fuchsia-100">Áp dụng cho {FINGER_LABEL_VI[selectedFinger]}</button>
            <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-violet-200">Làm mềm đường biên</span>
                <select value={smoothStrength} onChange={(event) => setSmoothStrength(event.target.value)} className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white outline-none">
                  <option value="1">Nhẹ</option>
                  <option value="2">Vừa</option>
                  <option value="3">Mạnh</option>
                  <option value="4">Rất mạnh</option>
                </select>
              </div>
              <p className="mb-2 text-[10px] leading-relaxed text-violet-200/70">Lọc tuần hoàn và bù diện tích để đường cong mượt nhưng không co móng.</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={smoothFinger} className="rounded-lg bg-violet-400/15 px-2 py-2 text-[11px] font-bold text-violet-100 hover:bg-violet-400/25">Ngón đang chọn</button>
                <button type="button" onClick={smoothAllFingers} className="rounded-lg bg-violet-400 px-2 py-2 text-[11px] font-bold text-slate-950 hover:bg-violet-300">Cả 5 ngón</button>
              </div>
            </div>
            {selectedNail && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Trục dọc UV</div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Axis X" value={String(selectedNail.axis[0])} onChange={(value) => setAxis(0, value)} step="0.001" />
                  <Field label="Axis Y" value={String(selectedNail.axis[1])} onChange={(value) => setAxis(1, value)} step="0.001" />
                </div>
              </div>
            )}
          </section>
        </aside>

        <main className="relative min-w-0 flex-1 overflow-hidden bg-[#111827]">
          <div className="absolute left-4 top-4 z-20 flex gap-2 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur">
            <ToolButton title="Chỉnh từng điểm (V)" active={tool === 'points'} onClick={() => setTool('points')}><MousePointer2 size={18} /></ToolButton>
            <ToolButton title="Di chuyển cả móng (M)" active={tool === 'move'} onClick={() => setTool('move')}><Move size={18} /></ToolButton>
            <ToolButton title="Kéo khung nhìn (H hoặc Alt+kéo)" active={tool === 'pan'} onClick={() => setTool('pan')}><Hand size={18} /></ToolButton>
            <span className="mx-1 w-px bg-white/10" />
            <ToolButton title="Thu nhỏ" onClick={() => adjustZoom(0.8)}><ZoomOut size={18} /></ToolButton>
            <div className="flex min-w-[66px] items-center justify-center text-xs font-bold text-slate-300">{Math.round(view.zoom * 100)}%</div>
            <ToolButton title="Phóng to" onClick={() => adjustZoom(1.25)}><ZoomIn size={18} /></ToolButton>
            <ToolButton title="Vừa toàn ảnh" onClick={fitHand}><Maximize2 size={18} /></ToolButton>
            <ToolButton title="Phóng tới ngón đang chọn" onClick={focusNail}><Focus size={18} /></ToolButton>
          </div>

          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur">
            <ToolButton title="Hiện/ẩn tất cả móng" active={showAll} onClick={() => setShowAll((value) => !value)}>{showAll ? <Eye size={18} /> : <EyeOff size={18} />}</ToolButton>
            <ToolButton title="Hiện/ẩn các điểm" active={showNodes} onClick={() => setShowNodes((value) => !value)}><MousePointer2 size={18} /></ToolButton>
            <ToolButton title="Lưới pixel" active={showGrid} onClick={() => setShowGrid((value) => !value)}><Grid3X3 size={18} /></ToolButton>
            <label className="flex items-center gap-2 px-2 text-[11px] font-semibold text-slate-400">
              Mask
              <input type="range" min="0" max="90" value={overlayOpacity} onChange={(event) => setOverlayOpacity(Number(event.target.value))} className="w-24 accent-fuchsia-500" />
              <span className="w-7 text-right">{overlayOpacity}%</span>
            </label>
          </div>

          <svg
            ref={svgRef}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            className={`h-full w-full touch-none select-none ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : tool === 'move' ? 'cursor-move' : 'cursor-crosshair'}`}
            onPointerDown={beginPan}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onWheel={(event) => { event.preventDefault(); adjustZoom(event.deltaY < 0 ? 1.12 : 0.89) }}
          >
            <defs>
              <pattern id="pixel-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={0.65 / Math.sqrt(view.zoom)} />
              </pattern>
            </defs>
            <image href={imageUrl} x="0" y="0" width={hand.width} height={hand.height} preserveAspectRatio="none" />
            {showGrid && <rect x="0" y="0" width={hand.width} height={hand.height} fill="url(#pixel-grid)" pointerEvents="none" />}
            {FINGER_ORDER.map((finger) => {
              if (!showAll && finger !== selectedFinger) return null
              const fingerPoints = points[finger]
              const polygon = fingerPoints.map((point) => `${point.x},${point.y}`).join(' ')
              const selected = finger === selectedFinger
              const color = FINGER_COLORS[finger]
              return (
                <g key={finger}>
                  <polygon
                    points={polygon}
                    fill={color}
                    fillOpacity={selected ? overlayOpacity / 100 : overlayOpacity / 170}
                    stroke={color}
                    strokeWidth={selected ? strokeWidth * 1.6 : strokeWidth}
                    vectorEffect="non-scaling-stroke"
                    className={tool === 'move' ? 'cursor-move' : 'cursor-crosshair'}
                    onPointerDown={(event) => beginShapeDrag(event, finger)}
                    onDoubleClick={(event) => addPointAt(event, finger)}
                  />
                  {selected && showNodes && fingerPoints.map((point, index) => (
                    <circle
                      key={`${finger}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={selectedPoint === index ? nodeRadius * 1.35 : nodeRadius}
                      fill={selectedPoint === index ? '#ffffff' : color}
                      stroke="#111827"
                      strokeWidth={strokeWidth}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(event) => beginPointDrag(event, finger, index)}
                    />
                  ))}
                </g>
              )
            })}
          </svg>

          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/90 px-4 py-2 text-center text-xs text-slate-300 shadow-xl backdrop-blur">
            <span className="font-bold text-white">{FINGER_LABEL_VI[selectedFinger]}</span>
            {' · '}{selectedPoints.length} điểm · Nhấp đúp cạnh để thêm điểm · Mũi tên: 1 px · Shift: 10 px · Alt: 0.1 px
          </div>
        </main>

        <aside className="vibe-scrollbar w-[330px] shrink-0 overflow-y-auto border-l border-white/10 bg-slate-900 p-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Điểm đang chọn</div>
              <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-mono text-slate-400">{selectedPoint == null ? '—' : `#${selectedPoint + 1}`}</span>
            </div>
            {selectedPoint != null && selectedPoints[selectedPoint] ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="X (px)" value={selectedPoints[selectedPoint].x.toFixed(1)} onChange={(value) => updateSelectedPoint('x', value)} />
                  <Field label="Y (px)" value={selectedPoints[selectedPoint].y.toFixed(1)} onChange={(value) => updateSelectedPoint('y', value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={addMidpoint} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold hover:bg-white/10"><Plus size={15} /> Thêm sau</button>
                  <button type="button" disabled={selectedPoints.length <= 3} onClick={deletePoint} className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-30"><Trash2 size={15} /> Xóa điểm</button>
                </div>
              </>
            ) : (
              <button type="button" onClick={addMidpoint} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-xs font-semibold text-slate-400 hover:border-fuchsia-400 hover:text-fuchsia-200"><Plus size={15} /> Thêm điểm giữa cạnh cuối</button>
            )}
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-400">
              Bước làm tròn
              <select value={snap} onChange={(event) => setSnap(event.target.value)} className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-white outline-none">
                <option value="0">Tắt</option>
                <option value="0.1">0.1 px</option>
                <option value="0.5">0.5 px</option>
                <option value="1">1 px</option>
              </select>
            </label>
          </section>

          <div className="my-5 h-px bg-white/10" />

          {selectedNail && (
            <section className="space-y-3">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Geometry tự tính</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-500">Tâm</div><div className="mt-1 font-mono text-white">{selectedNail.center[0]}, {selectedNail.center[1]}</div></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-500">Kích thước</div><div className="mt-1 font-mono text-white">{selectedNail.bbox[2]} × {selectedNail.bbox[3]}</div></div>
                <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-500">BBox [x, y, w, h]</div><div className="mt-1 font-mono text-white">[{selectedNail.bbox.join(', ')}]</div></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-500">U range</div><div className="mt-1 font-mono text-white">{selectedNail.uvFrame.minU}…{selectedNail.uvFrame.maxU}</div></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-500">V range</div><div className="mt-1 font-mono text-white">{selectedNail.uvFrame.minV}…{selectedNail.uvFrame.maxV}</div></div>
              </div>
              <textarea readOnly value={selectedNail.path} className="h-28 w-full resize-none rounded-xl border border-white/10 bg-black/25 p-3 font-mono text-[10px] leading-relaxed text-slate-400 outline-none" />
              <button type="button" onClick={() => navigator.clipboard.writeText(selectedNail.path).then(() => setMessage('Đã sao chép SVG path của ngón đang chọn.'))} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold hover:bg-white/10"><Clipboard size={15} /> Sao chép path ngón này</button>
            </section>
          )}

          <div className="my-5 h-px bg-white/10" />

          <section className="space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Nhập / xuất</div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-[11px] leading-relaxed text-sky-200">
              File xuất ra đặt tại:<br /><code className="mt-1 block break-all font-mono text-white">{destinationPath(tone, shape, length)}</code>
            </div>
            <button type="button" onClick={exportCurrent} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-fuchsia-500 py-2.5 text-sm font-bold"><Download size={16} /> Tải coordinates.json</button>
            <button type="button" onClick={copyCurrent} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold hover:bg-white/10"><Clipboard size={16} /> Sao chép toàn bộ JSON</button>
            <button type="button" onClick={() => importRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2.5 text-sm font-semibold text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200"><Upload size={16} /> Nhập coordinates.json</button>
            <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => event.target.files?.[0] && importCoordinates(event.target.files[0])} />
            <button type="button" onClick={resetVariant} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20"><RotateCcw size={16} /> Khôi phục file gốc</button>
          </section>
        </aside>
      </div>

      <footer className="flex h-9 shrink-0 items-center justify-between border-t border-white/10 bg-slate-950 px-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-2"><FileJson size={13} /><span>{key}</span><span>·</span><span>{hand.width}×{hand.height}</span><span>·</span><span>{hand.nails.reduce((sum, nail) => sum + parsePathPoints(nail.path).length, 0)} điểm</span></div>
        <div className={message ? 'text-sky-300' : ''}>{message || 'Mọi bbox, center và uvFrame được tính lại tự động khi geometry thay đổi.'}</div>
      </footer>
    </div>
  )
}
