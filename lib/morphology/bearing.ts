/**
 * Segment bearings.
 *
 * Boeing 2019, §"Methods" — "Street network orientation": each street segment
 * is assigned a compass bearing, and because a segment traversed either way
 * differs by exactly 180°, both directions are added to the distribution. That
 * is what makes the polar histogram 180°-rotationally symmetric by
 * construction rather than by accident (PRD §8).
 *
 * Bearings are degrees in [0, 360), clockwise from north.
 */

import { distanceM, edgeLengthM, type GraphEdge, type Point, type StreetGraph } from './graph'

export interface WeightedBearing {
  /** Compass bearing, degrees clockwise from north, [0, 360). */
  readonly bearingDeg: number
  /** Segment length in metres — the weight in the length-weighted model. */
  readonly lengthM: number
}

/**
 * Bearing of `from` → `to` in the local metric frame, clockwise from north.
 * `atan2(east, north)` rather than the mathematical `atan2(y, x)`: the compass
 * convention is where this kind of code bleeds, so it is written once, here.
 */
export function bearingDegBetween(from: Point, to: Point): number {
  const east = to.xM - from.xM
  const north = to.yM - from.yM
  const deg = (Math.atan2(east, north) * 180) / Math.PI
  return normaliseBearingDeg(deg)
}

/** Fold any angle into [0, 360). */
export function normaliseBearingDeg(deg: number): number {
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

/** The reciprocal of a bearing — the same segment walked the other way. */
export function reciprocalBearingDeg(deg: number): number {
  return normaliseBearingDeg(deg + 180)
}

/**
 * Every bearing an edge contributes: one per sub-segment of its geometry, in
 * both directions. A curving street is therefore a spread of bearings weighted
 * by where its length actually lies, not a single chord.
 */
export function edgeBearings(edge: GraphEdge): readonly WeightedBearing[] {
  const out: WeightedBearing[] = []
  for (let i = 1; i < edge.geometry.length; i += 1) {
    const from = edge.geometry[i - 1]!
    const to = edge.geometry[i]!
    const lengthM = distanceM(from, to)
    if (lengthM <= 0) continue
    const bearingDeg = bearingDegBetween(from, to)
    out.push({ bearingDeg, lengthM })
    out.push({ bearingDeg: reciprocalBearingDeg(bearingDeg), lengthM })
  }
  return out
}

/** Every weighted bearing in the graph, both directions, per Boeing. */
export function graphBearings(graph: StreetGraph): readonly WeightedBearing[] {
  return graph.edges.flatMap((edge) => edgeBearings(edge))
}

/** Median edge length in metres — Boeing's typical segment length. */
export function medianSegmentLengthM(graph: StreetGraph): number {
  if (graph.edges.length === 0) return 0
  const lengths = graph.edges.map(edgeLengthM).sort((a, b) => a - b)
  const middle = Math.floor(lengths.length / 2)
  if (lengths.length % 2 === 1) return lengths[middle]!
  return (lengths[middle - 1]! + lengths[middle]!) / 2
}
