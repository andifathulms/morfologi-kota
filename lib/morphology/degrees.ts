/**
 * Node degree statistics.
 *
 * Boeing 2019, §"Methods" — "Configuration": average node degree, the
 * proportion of intersections that are four-way, and the proportion of nodes
 * that are dead-ends. Together they are the configuration half of the
 * comparison — a gated perumahan and a kampung differ here as sharply as they
 * do in entropy.
 */

import { degreeMap, type StreetGraph } from './graph'

export interface DegreeStats {
  readonly nodeCount: number
  readonly edgeCount: number
  /** Sum of degrees ÷ node count. Equals 2·edges/nodes by the handshake identity. */
  readonly averageDegree: number
  /**
   * Proportion of all nodes at each degree class. Sums to exactly 1 for a
   * non-empty graph; the invariant suite asserts it.
   */
  readonly proportions: {
    readonly deadEnd: number
    readonly through: number
    readonly threeWay: number
    readonly fourWay: number
    readonly fivePlus: number
  }
  /** Nodes of degree ≥ 3 — the intersections, excluding dead-ends and shape nodes. */
  readonly intersectionCount: number
}

export function degreeStats(graph: StreetGraph): DegreeStats {
  const degrees = [...degreeMap(graph).values()]
  const nodeCount = degrees.length
  const edgeCount = graph.edges.length

  if (nodeCount === 0) {
    return {
      nodeCount: 0,
      edgeCount,
      averageDegree: 0,
      proportions: { deadEnd: 0, through: 0, threeWay: 0, fourWay: 0, fivePlus: 0 },
      intersectionCount: 0,
    }
  }

  let deadEnd = 0
  let through = 0
  let threeWay = 0
  let fourWay = 0
  let fivePlus = 0
  let degreeSum = 0
  for (const degree of degrees) {
    degreeSum += degree
    if (degree <= 1) deadEnd += 1
    else if (degree === 2) through += 1
    else if (degree === 3) threeWay += 1
    else if (degree === 4) fourWay += 1
    else fivePlus += 1
  }

  return {
    nodeCount,
    edgeCount,
    averageDegree: degreeSum / nodeCount,
    proportions: {
      deadEnd: deadEnd / nodeCount,
      through: through / nodeCount,
      threeWay: threeWay / nodeCount,
      fourWay: fourWay / nodeCount,
      fivePlus: fivePlus / nodeCount,
    },
    intersectionCount: threeWay + fourWay + fivePlus,
  }
}

/** Intersections per square kilometre over the fixed sampling disc. */
export function intersectionDensityPerKm2(stats: DegreeStats, radiusM: number): number {
  const areaKm2 = (Math.PI * radiusM * radiusM) / 1_000_000
  return areaKm2 > 0 ? stats.intersectionCount / areaKm2 : 0
}
