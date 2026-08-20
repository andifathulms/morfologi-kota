/**
 * Degree proportions sum to one, and the degree sum obeys the handshake
 * identity. Both are free, and both catch a graph built wrong.
 */

import { describe, expect, it } from 'vitest'
import { degreeMap, degreeStats, intersectionDensityPerKm2, type StreetGraph } from '@/lib/morphology'
import { gatedCluster, perfectGrid, pureTree, randomGeometricGraph } from '../synthetic/generators'

const fixtures: readonly [string, StreetGraph][] = [
  ['perfect grid', perfectGrid()],
  ['random geometric graph', randomGeometricGraph()],
  ['pure tree', pureTree().graph],
  ['gated cluster', gatedCluster()],
]

describe('degree statistics', () => {
  for (const [name, graph] of fixtures) {
    it(`${name} — proportions sum to one`, () => {
      const { proportions } = degreeStats(graph)
      const total =
        proportions.deadEnd +
        proportions.through +
        proportions.threeWay +
        proportions.fourWay +
        proportions.fivePlus
      expect(total).toBeCloseTo(1, 12)
    })

    it(`${name} — degree sum is twice the edge count`, () => {
      const sum = [...degreeMap(graph).values()].reduce((a, b) => a + b, 0)
      expect(sum).toBe(2 * graph.edges.length)
    })

    it(`${name} — intersection density is non-negative and finite`, () => {
      const density = intersectionDensityPerKm2(degreeStats(graph), 800)
      expect(density).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(density)).toBe(true)
    })
  }
})

describe('an empty graph', () => {
  it('reports zeroes rather than NaN', () => {
    const stats = degreeStats({ nodes: new Map(), edges: [] })
    expect(stats.averageDegree).toBe(0)
    expect(stats.proportions.deadEnd).toBe(0)
    expect(intersectionDensityPerKm2(stats, 800)).toBe(0)
  })
})
