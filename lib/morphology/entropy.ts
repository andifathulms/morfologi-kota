/**
 * Binned orientation entropy.
 *
 * Boeing 2019, §"Methods" — "Entropy": the bearings are binned into 36 bins of
 * 10°, and the Shannon entropy of the resulting distribution is
 *
 *     H = - Σ P(i) · ln P(i)
 *
 * with H_max = ln(36) ≈ 3.584 when every bin is equally occupied and H at its
 * minimum when the network collapses onto a small number of bearings.
 *
 * The binning follows OSMnx's implementation: bins are *centred* on 0°, 10°,
 * … 350°, so that a street a hair either side of due north falls in the same
 * bin rather than in two bins at opposite ends of the histogram. This detail
 * is the difference between a symmetric rose and a wrong one.
 */

import type { WeightedBearing } from './bearing'
import { normaliseBearingDeg } from './bearing'

/** Boeing 2019 uses 36 bins throughout. */
export const BIN_COUNT = 36
export const BIN_WIDTH_DEG = 360 / BIN_COUNT
export const MAX_ENTROPY = Math.log(BIN_COUNT)

/**
 * Entropy of a perfect single grid: four equally occupied bins, ln(4) ≈ 1.386.
 * Boeing 2019 §"Methods" gives it as H_g and uses it as the lower anchor of φ.
 */
export const GRID_ENTROPY = Math.log(4)

export interface Rose {
  /** Bin centres in degrees: 0, 10, … 350. */
  readonly binCentresDeg: readonly number[]
  /** Share of total weight in each bin. Sums to 1 (or all zeros for an empty graph). */
  readonly shares: readonly number[]
  /** Total weight binned — metres for the weighted model, count for the unweighted. */
  readonly totalWeight: number
}

/** The bin a bearing falls in, centred binning per OSMnx. */
export function binIndex(bearingDeg: number): number {
  const normalised = normaliseBearingDeg(bearingDeg)
  return Math.round(normalised / BIN_WIDTH_DEG) % BIN_COUNT
}

export function binCentreDeg(index: number): number {
  return index * BIN_WIDTH_DEG
}

/** The [start, end) bearing range a bin covers — what the rose reports on hover. */
export function binRangeDeg(index: number): { readonly startDeg: number; readonly endDeg: number } {
  const centre = binCentreDeg(index)
  return {
    startDeg: normaliseBearingDeg(centre - BIN_WIDTH_DEG / 2),
    endDeg: normaliseBearingDeg(centre + BIN_WIDTH_DEG / 2),
  }
}

export type Weighting = 'length' | 'count'

/**
 * Bin weighted bearings into the 36-bin rose.
 *
 * `length` is Boeing's length-weighted model — the one used for the published
 * figures, because it measures how much street runs in each direction rather
 * than how many segments the mapper happened to split a street into.
 */
export function buildRose(
  bearings: readonly WeightedBearing[],
  weighting: Weighting = 'length',
): Rose {
  const weights = new Array<number>(BIN_COUNT).fill(0)
  let total = 0
  for (const { bearingDeg, lengthM } of bearings) {
    const weight = weighting === 'length' ? lengthM : 1
    if (!(weight > 0)) continue
    weights[binIndex(bearingDeg)] = (weights[binIndex(bearingDeg)] ?? 0) + weight
    total += weight
  }
  const shares = total > 0 ? weights.map((w) => w / total) : weights
  return {
    binCentresDeg: Array.from({ length: BIN_COUNT }, (_, i) => binCentreDeg(i)),
    shares,
    totalWeight: total,
  }
}

/**
 * Shannon entropy of a binned distribution, in nats.
 * Empty bins contribute nothing: lim P→0 of P·ln P is 0.
 */
export function orientationEntropy(rose: Rose): number {
  let sum = 0
  for (const share of rose.shares) {
    if (share > 0) sum -= share * Math.log(share)
  }
  return sum
}

/** Entropy as a share of its maximum — dimensionless, in [0, 1]. */
export function normalisedEntropy(rose: Rose): number {
  return orientationEntropy(rose) / MAX_ENTROPY
}
