/** Convert a client (screen) point to the coordinate space of an SVG element's viewBox. */
export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): [number, number] {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return [0, 0]
  const transformed = pt.matrixTransform(ctm.inverse())
  return [transformed.x, transformed.y]
}
