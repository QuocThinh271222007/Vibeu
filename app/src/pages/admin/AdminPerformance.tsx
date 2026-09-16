import { useEffect, useMemo, useState } from 'react'
import { Gauge, Laptop, RefreshCcw, Smartphone } from 'lucide-react'
import { CLSThresholds, FCPThresholds, INPThresholds, LCPThresholds, TTFBThresholds } from 'web-vitals'
import { fetchPerformanceMetrics, type PerformanceMetricRow } from '@/lib/performanceApi'

type Rating = 'good' | 'needs-improvement' | 'poor'
type DeviceFilter = 'all' | 'mobile' | 'desktop'

const RANGE_OPTIONS: { label: string; hours: number }[] = [
  { label: '24 giờ', hours: 24 },
  { label: '7 ngày', hours: 24 * 7 },
  { label: '30 ngày', hours: 24 * 30 },
]

const METRICS: {
  key: PerformanceMetricRow['metric']
  label: string
  thresholds: [number, number]
  format: (v: number) => string
  hint: string
}[] = [
  {
    key: 'INP',
    label: 'INP — Phản hồi thao tác',
    thresholds: INPThresholds as [number, number],
    format: (v) => `${Math.round(v)}ms`,
    hint: 'Độ trễ khi khách bấm/chạm/kéo (đổi màu, kéo charm, kéo thanh ánh sáng...) — chỉ số phản ánh rõ nhất cảm giác "web bị lag".',
  },
  {
    key: 'LCP',
    label: 'LCP — Tải nội dung chính',
    thresholds: LCPThresholds as [number, number],
    format: (v) => `${(v / 1000).toFixed(2)}s`,
    hint: 'Thời gian hiện phần tử lớn nhất (ảnh bìa, canvas nail...) lên màn hình.',
  },
  {
    key: 'CLS',
    label: 'CLS — Xô lệch bố cục',
    thresholds: CLSThresholds as [number, number],
    format: (v) => v.toFixed(3),
    hint: 'Mức độ giao diện bị nhảy/lệch trong lúc tải trang. Không có đơn vị, càng thấp càng tốt.',
  },
  {
    key: 'FCP',
    label: 'FCP — Hiện nội dung đầu tiên',
    thresholds: FCPThresholds as [number, number],
    format: (v) => `${(v / 1000).toFixed(2)}s`,
    hint: 'Thời gian hiện chữ/ảnh đầu tiên lên màn hình sau khi bấm vào trang.',
  },
  {
    key: 'TTFB',
    label: 'TTFB — Phản hồi máy chủ',
    thresholds: TTFBThresholds as [number, number],
    format: (v) => `${(v / 1000).toFixed(2)}s`,
    // Only about the initial HTML document request (wherever index.html is hosted) — never about
    // Supabase, which isn't involved until after the page has already started loading.
    hint: 'Thời gian chờ phản hồi trang HTML ban đầu từ nơi host web (không liên quan Supabase) — phụ thuộc hosting/CDN, không phải do code app.',
  },
]

const RATING_LABEL_VI: Record<Rating, string> = { good: 'Tốt', 'needs-improvement': 'Cần cải thiện', poor: 'Kém' }
const RATING_BAR_COLOR: Record<Rating, string> = { good: 'bg-emerald-500', 'needs-improvement': 'bg-amber-500', poor: 'bg-red-500' }
const RATING_TEXT_COLOR: Record<Rating, string> = { good: 'text-emerald-600', 'needs-improvement': 'text-amber-600', poor: 'text-red-600' }

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))
  return sorted[idx]
}

function classify(value: number, [good, poor]: [number, number]): Rating {
  if (value <= good) return 'good'
  if (value > poor) return 'poor'
  return 'needs-improvement'
}

export default function AdminPerformance() {
  const [rangeHours, setRangeHours] = useState(24 * 7)
  const [device, setDevice] = useState<DeviceFilter>('all')
  const [rows, setRows] = useState<PerformanceMetricRow[]>([])
  const [loading, setLoading] = useState(true)

  function reload() {
    setLoading(true)
    fetchPerformanceMetrics(rangeHours).then((data) => {
      setRows(data)
      setLoading(false)
    })
  }

  useEffect(reload, [rangeHours])

  const filtered = useMemo(() => (device === 'all' ? rows : rows.filter((r) => r.device === device)), [rows, device])

  const summaries = useMemo(
    () =>
      METRICS.map((m) => {
        const scoped = filtered.filter((r) => r.metric === m.key)
        const values = scoped.map((r) => r.value)
        const total = values.length
        const p75 = percentile(values, 0.75)
        const counts: Record<Rating, number> = { good: 0, 'needs-improvement': 0, poor: 0 }
        for (const r of scoped) counts[r.rating] += 1
        return {
          ...m,
          total,
          p75,
          p75Rating: total > 0 ? classify(p75, m.thresholds) : null,
          pct: {
            good: total > 0 ? (counts.good / total) * 100 : 0,
            'needs-improvement': total > 0 ? (counts['needs-improvement'] / total) * 100 : 0,
            poor: total > 0 ? (counts.poor / total) * 100 : 0,
          },
        }
      }),
    [filtered],
  )

  const totalSamples = filtered.length ? new Set(filtered.map((r) => `${r.path}|${r.device}|${r.created_at}`)).size : 0

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-vibe-ink">
            <Gauge size={22} className="text-vibe-pink-dark" /> Hiệu năng &amp; hiệu suất
          </h1>
          <p className="mt-1 text-sm text-vibe-ink-soft">
            Core Web Vitals đo thật từ trình duyệt khách hàng (không phải máy chủ) — không thu thập trên các trang /admin.
          </p>
        </div>
        <button
          onClick={reload}
          className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm font-medium text-vibe-ink-soft hover:border-vibe-pink/40 hover:text-vibe-ink"
        >
          <RefreshCcw size={14} /> Làm mới
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full bg-vibe-cream p-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.hours}
              onClick={() => setRangeHours(r.hours)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                rangeHours === r.hours ? 'bg-vibe-ink text-white' : 'text-vibe-ink-soft hover:text-vibe-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-vibe-cream p-1">
          {(
            [
              ['all', 'Tất cả thiết bị'],
              ['mobile', 'Điện thoại'],
              ['desktop', 'Máy tính'],
            ] as [DeviceFilter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                device === id ? 'bg-vibe-ink text-white' : 'text-vibe-ink-soft hover:text-vibe-ink'
              }`}
            >
              {id === 'mobile' && <Smartphone size={12} />}
              {id === 'desktop' && <Laptop size={12} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-4 rounded-2xl bg-white p-8 text-center text-sm text-vibe-ink-soft shadow-sm">Đang tải...</p>
      ) : totalSamples === 0 ? (
        <p className="mt-4 rounded-2xl bg-white p-8 text-center text-sm text-vibe-ink-soft shadow-sm">
          Chưa có dữ liệu trong khoảng thời gian này.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {summaries.map((m) => (
            <div key={m.key} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-vibe-ink">{m.label}</p>
                  <p className="mt-0.5 max-w-md text-xs text-vibe-ink-soft">{m.hint}</p>
                </div>
                <div className="text-right">
                  {m.total === 0 ? (
                    <p className="text-xs text-vibe-ink-soft">Chưa có dữ liệu</p>
                  ) : (
                    <>
                      <p className={`font-display text-2xl font-semibold ${RATING_TEXT_COLOR[m.p75Rating!]}`}>{m.format(m.p75)}</p>
                      <p className="text-[11px] text-vibe-ink-soft">p75 · {m.total} lượt đo</p>
                    </>
                  )}
                </div>
              </div>

              {m.total > 0 && (
                <div className="mt-3">
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-vibe-cream">
                    {(['good', 'needs-improvement', 'poor'] as Rating[]).map(
                      (r) => m.pct[r] > 0 && <div key={r} className={RATING_BAR_COLOR[r]} style={{ width: `${m.pct[r]}%` }} />,
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-vibe-ink-soft">
                    {(['good', 'needs-improvement', 'poor'] as Rating[]).map(
                      (r) =>
                        m.pct[r] > 0 && (
                          <span key={r} className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${RATING_BAR_COLOR[r]}`} />
                            {RATING_LABEL_VI[r]} {Math.round(m.pct[r])}%
                          </span>
                        ),
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
