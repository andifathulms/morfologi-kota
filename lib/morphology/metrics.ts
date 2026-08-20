/**
 * The metric column, assembled.
 *
 * One function from a clipped graph to every number a card prints. Nothing is
 * computed in a component (CLAUDE.md, Invariants) — this runs in the pipeline
 * and its output is what ships.
 *
 * There is no score, grade, rank or index here, and adding one is a design
 * regression (PRD §4).
 */

import { graphBearings, medianSegmentLengthM } from './bearing'
import { edgeCircuity, sampledCircuity, type SampleOptions } from './circuity'
import { degreeStats, intersectionDensityPerKm2, type DegreeStats } from './degrees'
import { buildRose, normalisedEntropy, orientationEntropy, type Rose } from './entropy'
import { totalLengthM, type StreetGraph } from './graph'
import { orientationOrder } from './phi'

export interface ModeMetrics {
  /** 36-bin length-weighted rose. Boeing's published model. */
  readonly rose: Rose
  /** H, in nats. */
  readonly orientationEntropy: number
  /** H ÷ ln 36, dimensionless. */
  readonly normalisedEntropy: number
  /** φ, Boeing's orientation-order indicator. */
  readonly orientationOrder: number
  /** Boeing's edge-length ÷ chord-length circuity. */
  readonly edgeCircuity: number
  /** Mean of shortest-path ÷ straight-line over the deterministic pair sample. */
  readonly sampledCircuity: number
  readonly sampledPairCount: number
  readonly unreachablePairCount: number
  readonly degrees: DegreeStats
  readonly intersectionDensityPerKm2: number
  readonly medianSegmentLengthM: number
  readonly totalLengthM: number
}

export interface ComputeOptions {
  readonly radiusM: number
  readonly sample?: SampleOptions
}

export function computeModeMetrics(graph: StreetGraph, options: ComputeOptions): ModeMetrics {
  const rose = buildRose(graphBearings(graph), 'length')
  const degrees = degreeStats(graph)
  const sampled = sampledCircuity(graph, options.sample)

  return {
    rose,
    orientationEntropy: orientationEntropy(rose),
    normalisedEntropy: normalisedEntropy(rose),
    orientationOrder: orientationOrder(rose),
    edgeCircuity: edgeCircuity(graph),
    sampledCircuity: sampled.meanCircuity,
    sampledPairCount: sampled.pairs.length,
    unreachablePairCount: sampled.unreachablePairs,
    degrees,
    intersectionDensityPerKm2: intersectionDensityPerKm2(degrees, options.radiusM),
    medianSegmentLengthM: medianSegmentLengthM(graph),
    totalLengthM: totalLengthM(graph),
  }
}

/**
 * The gap between the two modes — the product (PRD §2, §6.2).
 *
 * Signed differences, walk minus drive. Not a score: a large positive entropy
 * delta says the walking network reaches in directions the driving network
 * does not, which is a description of form, not a verdict on it.
 */
export interface ModeDelta {
  readonly orientationEntropy: number
  readonly normalisedEntropy: number
  readonly orientationOrder: number
  readonly sampledCircuity: number
  readonly averageDegree: number
  readonly deadEndProportion: number
  readonly fourWayProportion: number
  readonly intersectionDensityPerKm2: number
  readonly medianSegmentLengthM: number
  readonly totalLengthM: number
}

export function modeDelta(drive: ModeMetrics, walk: ModeMetrics): ModeDelta {
  return {
    orientationEntropy: walk.orientationEntropy - drive.orientationEntropy,
    normalisedEntropy: walk.normalisedEntropy - drive.normalisedEntropy,
    orientationOrder: walk.orientationOrder - drive.orientationOrder,
    sampledCircuity: walk.sampledCircuity - drive.sampledCircuity,
    averageDegree: walk.degrees.averageDegree - drive.degrees.averageDegree,
    deadEndProportion: walk.degrees.proportions.deadEnd - drive.degrees.proportions.deadEnd,
    fourWayProportion: walk.degrees.proportions.fourWay - drive.degrees.proportions.fourWay,
    intersectionDensityPerKm2: walk.intersectionDensityPerKm2 - drive.intersectionDensityPerKm2,
    medianSegmentLengthM: walk.medianSegmentLengthM - drive.medianSegmentLengthM,
    totalLengthM: walk.totalLengthM - drive.totalLengthM,
  }
}
