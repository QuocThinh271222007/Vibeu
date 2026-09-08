import { useRef } from 'react'

/**
 * A horizontally-scrolling row (category chips, filter pills) that's actually usable with
 * a normal mouse — plain `overflow-x-auto` + a hidden scrollbar (`no-scrollbar`, used for
 * a cleaner look) leaves NO way to reach the hidden content for anyone without a trackpad
 * that does horizontal swipes: a vertical mouse wheel does nothing to a horizontal-only
 * overflow container, and with the scrollbar hidden there's nothing to drag either (user
 * report: "phần danh mục charm ko lướt qua được" — the category section can't be scrolled
 * through). This adds two more input paths on top of native touch/trackpad scrolling:
 *   1. Vertical wheel input is redirected to horizontal scroll.
 *   2. Click-and-drag (pointer-based, works for mouse and touch alike) pans the row.
 */
export function ScrollableRow({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ active: boolean; startX: number; startScroll: number; moved: boolean }>({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  })

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const el = ref.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    // Only take over when the row actually has horizontal room to scroll and the gesture
    // is predominantly vertical (a trackpad's own horizontal swipe already works natively
    // and should be left alone).
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false }
    // Pointer capture is NOT grabbed here on down — capturing immediately retargets the
    // eventual click event to this row instead of whatever chip/button the pointer landed
    // on (a Chromium pointer-capture quirk), which silently broke every click inside a
    // ScrollableRow (user report: "danh mục thư viện charm ko hoạt động, click không đổi
    // danh mục theo click"). Capture is deferred to onPointerMove, once an actual drag is
    // detected, so a plain tap/click still reaches its real target normally.
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || !drag.current.active) return
    const dx = e.clientX - drag.current.startX
    if (!drag.current.moved && Math.abs(dx) > 3) {
      drag.current.moved = true
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        // Some pointer sources (synthetic events, certain touch/pen edge cases) have no
        // active pointer to capture — dragging still works via bubbled pointermove/up.
      }
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startScroll - dx
  }

  const endDrag = () => {
    drag.current.active = false
  }

  return (
    <div
      ref={ref}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      // After a real drag (not just a click), swallow the subsequent click so dragging
      // across a chip doesn't also fire its onClick.
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      className={`no-scrollbar cursor-grab select-none overflow-x-auto active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  )
}
