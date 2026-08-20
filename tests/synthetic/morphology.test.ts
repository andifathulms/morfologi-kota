/**
 * The synthetic suite. These fixtures are permanent (CLAUDE.md, Testing
 * rules): their answers are known by construction, so correctness here is
 * provable rather than plausible.
 */

import { describe, expect, it } from 'vitest'
import {
  BIN_COUNT,
  GRID_ENTROPY,
  MAX_ENTROPY,
  buildRose,
  degreeStats,
  edgeCircuity,
  graphBearings,
  medianSegmentLengthM,
  normalisedEntropy,
  orientationEntropy,
  orientationOrder,
  sampledCircuity,
} from '@/lib/morphology'
import { gatedCluster, perfectGrid, pureTree, randomGeometricGraph, rotatedGrid } from './generators'

const roseOf = (graph: Parameters<typeof graphBearings>[0]) => buildRose(graphBearings(graph))

describe('perfect square grid', () => {
  const grid = perfectGrid()
  const rose = roseOf(grid)

  it('populates exactly four bins', () => {
    const populated = rose.shares.filter((share) => share > 0)
    expect(populated).toHaveLength(4)
  })

  it('populates the cardinal bins, a quarter of the length in each', () => {
    for (const index of [0, 9, 18, 27]) {
      expect(rose.shares[index]).toBeCloseTo(0.25, 12)
    }
  })

  it('sits at the minimum entropy of a single grid, ln 4', () => {
    expect(orientationEntropy(rose)).toBeCloseTo(GRID_ENTROPY, 12)
  })

  it('gives phi at its maximum', () => {
    expect(orientationOrder(rose)).toBeCloseTo(1, 12)
  })

  it('has average degree just under four and no dead-ends', () => {
    const stats = degreeStats(grid)
    // 9x9 grid: 4 corners of degree 2, 28 edge nodes of degree 3, 49 of degree 4.
    expect(stats.nodeCount).toBe(81)
    expect(stats.proportions.deadEnd).toBe(0)
    expect(stats.proportions.fourWay).toBeCloseTo(49 / 81, 12)
    expect(stats.averageDegree).toBeCloseTo((2 * stats.edgeCount) / stats.nodeCount, 12)
  })

  it('has circuity exactly one — every edge is its own chord', () => {
    expect(edgeCircuity(grid)).toBeCloseTo(1, 12)
  })

  it('has a median segment length equal to the spacing', () => {
    expect(medianSegmentLengthM(grid)).toBeCloseTo(100, 9)
  })
})

describe('the same grid rotated 29 degrees', () => {
  const grid = perfectGrid()
  const rotated = rotatedGrid(29)
  const base = roseOf(grid)
  const turned = roseOf(rotated)

  it('gives identical entropy — the measure is rotation-invariant', () => {
    expect(orientationEntropy(turned)).toBeCloseTo(orientationEntropy(base), 10)
  })

  it('gives identical phi', () => {
    expect(orientationOrder(turned)).toBeCloseTo(orientationOrder(base), 10)
  })

  it('shifts the bins by 29 degrees, which is three bins of ten', () => {
    const populated = turned.shares
      .map((share, index) => ({ share, index }))
      .filter((bin) => bin.share > 0)
      .map((bin) => bin.index)
    expect(populated).toEqual([3, 12, 21, 30])
  })

  it('still populates exactly four bins', () => {
    expect(turned.shares.filter((share) => share > 0)).toHaveLength(4)
  })
})

describe('a grid rotated by a whole bin width', () => {
  it('reproduces the original rose exactly, rolled', () => {
    const base = roseOf(perfectGrid())
    const turned = roseOf(rotatedGrid(10))
    for (let i = 0; i < BIN_COUNT; i += 1) {
      expect(turned.shares[(i + 1) % BIN_COUNT]).toBeCloseTo(base.shares[i]!, 10)
    }
  })
})

describe('random geometric graph', () => {
  const graph = randomGeometricGraph()
  const rose = roseOf(graph)

  it('sits near maximum entropy', () => {
    expect(normalisedEntropy(rose)).toBeGreaterThan(0.95)
    expect(orientationEntropy(rose)).toBeLessThanOrEqual(MAX_ENTROPY)
  })

  it('gives phi near zero — nothing like a single grid', () => {
    expect(orientationOrder(rose)).toBeLessThan(0.15)
  })

  it('populates every bin', () => {
    expect(rose.shares.filter((share) => share > 0)).toHaveLength(BIN_COUNT)
  })
})

describe('pure tree', () => {
  const tree = pureTree()

  it('gives its constructed dead-end proportion exactly', () => {
    const stats = degreeStats(tree.graph)
    expect(stats.proportions.deadEnd).toBeCloseTo(tree.expectedDeadEndProportion, 12)
  })

  it('has one fewer edge than nodes, as a tree must', () => {
    expect(tree.graph.edges.length).toBe(tree.nodeCount - 1)
  })

  it('has average degree just under two', () => {
    const stats = degreeStats(tree.graph)
    expect(stats.averageDegree).toBeCloseTo(2 - 2 / tree.nodeCount, 12)
    expect(stats.averageDegree).toBeLessThan(2)
  })

  it('has no four-way intersections', () => {
    expect(degreeStats(tree.graph).proportions.fourWay).toBe(0)
  })
})

describe('the shapes the project claims to tell apart', () => {
  it('gives a gated cluster a far higher dead-end proportion than a grid', () => {
    const cluster = degreeStats(gatedCluster())
    const grid = degreeStats(perfectGrid())
    expect(cluster.proportions.deadEnd).toBeGreaterThan(0.6)
    expect(grid.proportions.deadEnd).toBe(0)
  })

  it('gives a gated cluster a far higher sampled circuity than a grid', () => {
    const cluster = sampledCircuity(gatedCluster(), { pairCount: 400 })
    const grid = sampledCircuity(perfectGrid(), { pairCount: 400 })
    expect(cluster.meanCircuity).toBeGreaterThan(grid.meanCircuity)
  })
})
