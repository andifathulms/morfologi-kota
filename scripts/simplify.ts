/**
 * Geometry simplification — for drawing only.
 *
 * Every metric is computed from the full geometry; this runs afterwards, on
 * the copy that ships, so the payload stays small (PRD §7). Ramer–Douglas–
 * Peucker at a tolerance well below a hairline's worth of screen at the sizes
 * a card is drawn, so nothing visible is lost.
 */

import type { Point } from '@/lib/morphology'

function perpendicularDistanceM(point: Point, start: Point, end: Point): number {
  const dx = end.xM - start.xM
  const dy = end.yM - start.yM
  if (dx === 0 && dy === 0) return Math.hypot(point.xM - start.xM, point.yM - start.yM)
  const numerator = Math.abs(dy * point.xM - dx * point.yM + end.xM * start.yM - end.yM * start.xM)
  return numerator / Math.hypot(dx, dy)
}

export function simplifyPolyline(points: readonly Point[], toleranceM: number): readonly Point[] {
  if (points.length <= 2) return points
  const start = points[0]!
  const end = points[points.length - 1]!

  let worstIndex = 0
  let worstDistance = 0
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistanceM(points[i]!, start, end)
    if (distance > worstDistance) {
      worstDistance = distance
      worstIndex = i
    }
  }

  if (worstDistance <= toleranceM) return [start, end]
  const left = simplifyPolyline(points.slice(0, worstIndex + 1), toleranceM)
  const right = simplifyPolyline(points.slice(worstIndex), toleranceM)
  return [...left.slice(0, -1), ...right]
}
