/**
 * Rose symmetry, asserted from the first commit.
 *
 * A segment traversed either way differs by exactly 180°, so every 36-bin
 * histogram must be 180°-rotationally symmetric. The check costs nothing and
 * catches the likeliest bug in the project — a wrong bearing convention
 * (PRD §8, CLAUDE.md Invariants §7).
 */

import { describe, expect, it } from 'vitest'
import {
  BIN_COUNT,
  BIN_WIDTH_DEG,
  bearingDegBetween,
  binIndex,
  binRangeDeg,
  buildRose,
  graphBearings,
  normaliseBearingDeg,
  reciprocalBearingDeg,
  type Rose,
  type StreetGraph,
} from '@/lib/morphology'
import { gatedCluster, perfectGrid, pureTree, randomGeometricGraph, rotatedGrid } from '../synthetic/generators'

export function expectRoseSymmetric(rose: Rose, precision = 10): void {
  const half = BIN_COUNT / 2
  for (let i = 0; i < half; i += 1) {
    expect(rose.shares[i]).toBeCloseTo(rose.shares[i + half]!, precision)
  }
}

const fixtures: readonly [string, StreetGraph][] = [
  ['perfect grid', perfectGrid()],
  ['grid rotated 29°', rotatedGrid(29)],
  ['grid rotated 7.3°', rotatedGrid(7.3)],
  ['random geometric graph', randomGeometricGraph()],
  ['pure tree', pureTree().graph],
  ['gated cluster', gatedCluster()],
]

describe('every rose is 180-degree rotationally symmetric', () => {
  for (const [name, graph] of fixtures) {
    it(name, () => {
      expectRoseSymmetric(buildRose(graphBearings(graph)))
    })

    it(`${name} — unweighted model too`, () => {
      expectRoseSymmetric(buildRose(graphBearings(graph), 'count'))
    })
  }
})

describe('every rose sums to one', () => {
  for (const [name, graph] of fixtures) {
    it(name, () => {
      const rose = buildRose(graphBearings(graph))
      const total = rose.shares.reduce((sum, share) => sum + share, 0)
      expect(total).toBeCloseTo(1, 12)
    })
  }
})

describe('bearing convention', () => {
  it('puts due north at 0 and due east at 90', () => {
    const origin = { xM: 0, yM: 0 }
    expect(bearingDegBetween(origin, { xM: 0, yM: 1 })).toBeCloseTo(0, 12)
    expect(bearingDegBetween(origin, { xM: 1, yM: 0 })).toBeCloseTo(90, 12)
    expect(bearingDegBetween(origin, { xM: 0, yM: -1 })).toBeCloseTo(180, 12)
    expect(bearingDegBetween(origin, { xM: -1, yM: 0 })).toBeCloseTo(270, 12)
  })

  it('normalises into [0, 360)', () => {
    expect(normaliseBearingDeg(-1)).toBeCloseTo(359, 12)
    expect(normaliseBearingDeg(360)).toBe(0)
    expect(normaliseBearingDeg(721)).toBeCloseTo(1, 12)
  })

  it('makes the reciprocal an involution', () => {
    for (const deg of [0, 17, 90, 179.9, 271, 359.999]) {
      expect(reciprocalBearingDeg(reciprocalBearingDeg(deg))).toBeCloseTo(deg, 10)
    }
  })
})

describe('binning', () => {
  it('centres bins on the multiples of ten', () => {
    expect(binIndex(0)).toBe(0)
    expect(binIndex(4.9)).toBe(0)
    expect(binIndex(355.1)).toBe(0)
    expect(binIndex(90)).toBe(9)
    expect(binIndex(359.999)).toBe(0)
  })

  it('reports a range of one bin width around each centre', () => {
    const range = binRangeDeg(9)
    expect(range.startDeg).toBeCloseTo(85, 12)
    expect(range.endDeg).toBeCloseTo(95, 12)
    expect(BIN_WIDTH_DEG).toBe(10)
  })

  it('wraps the first bin across north', () => {
    const range = binRangeDeg(0)
    expect(range.startDeg).toBeCloseTo(355, 12)
    expect(range.endDeg).toBeCloseTo(5, 12)
  })
})
