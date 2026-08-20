/**
 * Circuity is ≥ 1 for every sampled pair, by definition. A value below 1 means
 * the network distance calculation is broken (PRD §8, CLAUDE.md Invariants §8).
 */

import { describe, expect, it } from 'vitest'
import { edgeCircuity, sampledCircuity, shortestPathLengthsM, type StreetGraph } from '@/lib/morphology'
import { gatedCluster, perfectGrid, pureTree, randomGeometricGraph, rotatedGrid } from '../synthetic/generators'

const fixtures: readonly [string, StreetGraph][] = [
  ['perfect grid', perfectGrid()],
  ['grid rotated 29°', rotatedGrid(29)],
  ['random geometric graph', randomGeometricGraph()],
  ['pure tree', pureTree().graph],
  ['gated cluster', gatedCluster()],
]

describe('circuity is at least one', () => {
  for (const [name, graph] of fixtures) {
    it(`${name} — every sampled pair`, () => {
      const sampled = sampledCircuity(graph, { pairCount: 300 })
      expect(sampled.pairs.length).toBeGreaterThan(0)
      for (const pair of sampled.pairs) {
        expect(pair.circuity).toBeGreaterThanOrEqual(1 - 1e-9)
        expect(pair.networkM).toBeGreaterThanOrEqual(pair.straightM - 1e-9)
      }
      expect(sampled.meanCircuity).toBeGreaterThanOrEqual(1 - 1e-9)
    })

    it(`${name} — edge circuity`, () => {
      expect(edgeCircuity(graph)).toBeGreaterThanOrEqual(1 - 1e-12)
    })
  }
})

describe('the sample is deterministic', () => {
  it('draws the same pairs in the same order for the same seed', () => {
    const graph = randomGeometricGraph()
    const a = sampledCircuity(graph, { pairCount: 200, seed: 99 })
    const b = sampledCircuity(graph, { pairCount: 200, seed: 99 })
    expect(a.meanCircuity).toBe(b.meanCircuity)
    expect(a.pairs.map((p) => `${p.fromId}>${p.toId}`)).toEqual(
      b.pairs.map((p) => `${p.fromId}>${p.toId}`),
    )
  })
})

describe('shortest paths', () => {
  it('measures a grid detour exactly — Manhattan distance along the grid', () => {
    const grid = perfectGrid({ streets: 5, spacingM: 100 })
    const lengths = shortestPathLengthsM(grid, 'g0_0')
    expect(lengths.get('g0_0')).toBe(0)
    expect(lengths.get('g4_4')).toBeCloseTo(800, 9)
    expect(lengths.get('g2_1')).toBeCloseTo(300, 9)
  })

  it('leaves a disconnected node unreached', () => {
    const grid = perfectGrid({ streets: 3 })
    const lengths = shortestPathLengthsM(grid, 'g0_0')
    expect(lengths.has('g2_2')).toBe(true)
  })
})
