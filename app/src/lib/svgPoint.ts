/**
 * Convert a client (screen) point to the coordinate space of an SVG element's viewBox.
 * Returns null when the browser can't produce a screen CTM yet (detached/pre-layout
 * SVG) — callers must skip the update for that frame rather than treat a fallback
 * value as a real coordinate, which would otherwise snap a drag to the origin.
 */
export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): [number, number] | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const transformed = pt.matrixTransform(ctm.inverse())
  return [transformed.x, transformed.y]
}
