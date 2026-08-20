/**
 * φ — the orientation-order indicator.
 *
 * Boeing 2019, §"Methods" — "Entropy": orientation-order is defined as
 *
 *     φ = 1 − ((H_o − H_g) / (H_max − H_g))²
 *
 * where H_o is the network's orientation entropy, H_g = ln(4) ≈ 1.386 is the
 * entropy of a perfect single grid, and H_max = ln(36) ≈ 3.584 is that of a
 * perfectly uniform distribution over the 36 bins.
 *
 * φ = 1 is a single perfect grid; φ = 0 is a perfectly disordered network.
 * Boeing reports Chicago at φ = 0.90 as the closest thing in his sample to one
 * grid. It measures *how closely a network follows the logic of a single
 * grid* — it is not a quality, and nothing in this codebase treats it as one.
 */

import { GRID_ENTROPY, MAX_ENTROPY, orientationEntropy, type Rose } from './entropy'

export function orientationOrderFromEntropy(entropy: number): number {
  const ratio = (entropy - GRID_ENTROPY) / (MAX_ENTROPY - GRID_ENTROPY)
  const phi = 1 - ratio * ratio
  // A network more concentrated than a four-bin grid (a single street, say)
  // pushes the ratio negative and φ back above 1; clamp so the indicator
  // stays the [0, 1] quantity the paper defines.
  return Math.min(1, Math.max(0, phi))
}

export function orientationOrder(rose: Rose): number {
  return orientationOrderFromEntropy(orientationEntropy(rose))
}
