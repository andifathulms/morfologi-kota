/**
 * Footway coverage confidence.
 *
 * The headline finding depends on gang being mapped (PRD §4). If a kampung's
 * alleys are absent from OpenStreetMap, its walking network collapses toward
 * its driving network and the gap disappears — not because it is not there,
 * but because nobody mapped it. So every site reports how much of its walking
 * network is pedestrian-only class, and a site below the threshold is flagged
 * rather than compared.
 *
 * This is a measure of the *data*, not of the place. A thin flag says the
 * survey is incomplete; it never says the neighbourhood lacks alleys.
 */

import { isPedestrianOnly, type TaggedWay } from '@/lib/tags'
import { edgeLengthM, type StreetGraph } from './graph'

/**
 * Below this share of walking-network length in pedestrian-only classes, the
 * walking network is too close to the driving network for the gap to be read
 * as a finding. Chosen so that a site whose alleys are simply unmapped cannot
 * pass: an Indonesian kampung with its gang surveyed runs far above it, and a
 * site with none at all sits at zero.
 */
export const THIN_COVERAGE_THRESHOLD = 0.15

/** Above this share, coverage is good enough that the gap is safely readable. */
export const GOOD_COVERAGE_THRESHOLD = 0.35

export type CoverageConfidence =
  | { readonly type: 'thin'; readonly pedestrianShare: number }
  | { readonly type: 'moderate'; readonly pedestrianShare: number }
  | { readonly type: 'good'; readonly pedestrianShare: number }

export interface Coverage {
  /** Share of walking-network length carried by pedestrian-only classes, [0, 1]. */
  readonly pedestrianShare: number
  readonly pedestrianLengthM: number
  readonly walkLengthM: number
  /** Pedestrian-only length per square kilometre of the sampling disc. */
  readonly pedestrianDensityMPerKm2: number
  readonly confidence: CoverageConfidence
}

export function classifyCoverage(pedestrianShare: number): CoverageConfidence {
  if (pedestrianShare < THIN_COVERAGE_THRESHOLD) return { type: 'thin', pedestrianShare }
  if (pedestrianShare < GOOD_COVERAGE_THRESHOLD) return { type: 'moderate', pedestrianShare }
  return { type: 'good', pedestrianShare }
}

/** True when a site must not be compared as though its walking network were complete. */
export function isThin(confidence: CoverageConfidence): boolean {
  switch (confidence.type) {
    case 'thin':
      return true
    case 'moderate':
    case 'good':
      return false
    default: {
      const never: never = confidence
      throw new Error(`unknown confidence: ${JSON.stringify(never)}`)
    }
  }
}

/**
 * Coverage of a walking graph. Edges carry the tags of the way they came from,
 * so the classification uses `lib/tags` rather than a `highway=` check here.
 */
export function coverageOfWalkGraph(walkGraph: StreetGraph, radiusM: number): Coverage {
  let pedestrianLengthM = 0
  let walkLengthM = 0
  for (const edge of walkGraph.edges) {
    const length = edgeLengthM(edge)
    walkLengthM += length
    const way: TaggedWay = { id: edge.wayId ?? 0, tags: edge.tags ?? {}, nodes: [] }
    if (isPedestrianOnly(way)) pedestrianLengthM += length
  }
  const pedestrianShare = walkLengthM > 0 ? pedestrianLengthM / walkLengthM : 0
  const areaKm2 = (Math.PI * radiusM * radiusM) / 1_000_000
  return {
    pedestrianShare,
    pedestrianLengthM,
    walkLengthM,
    pedestrianDensityMPerKm2: areaKm2 > 0 ? pedestrianLengthM / areaKm2 : 0,
    confidence: classifyCoverage(pedestrianShare),
  }
}
