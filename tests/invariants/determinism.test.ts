/**
 * Determinism: the same inputs must produce the same bundle, byte for byte
 * (PRD §8). The pipeline rounds before writing and seeds its circuity sample
 * for exactly this reason, and both are checked here.
 */

import { describe, expect, it } from 'vitest'
import { computeModeMetrics, sampledCircuity } from '@/lib/morphology'
import { gatedCluster, perfectGrid, randomGeometricGraph } from '../synthetic/generators'

describe('the metric column is a pure function of the graph', () => {
  for (const [name, graph] of [
    ['perfect grid', perfectGrid()],
    ['random geometric graph', randomGeometricGraph()],
    ['gated cluster', gatedCluster()],
  ] as const) {
    it(`${name} — twice over gives an identical serialisation`, () => {
      const first = JSON.stringify(computeModeMetrics(graph, { radiusM: 800 }))
      const second = JSON.stringify(computeModeMetrics(graph, { radiusM: 800 }))
      expect(first).toBe(second)
    })
  }
})

describe('the circuity sample', () => {
  it('depends on its seed and on nothing else', () => {
    const graph = randomGeometricGraph()
    const a = sampledCircuity(graph, { seed: 1, pairCount: 120 })
    const b = sampledCircuity(graph, { seed: 1, pairCount: 120 })
    const c = sampledCircuity(graph, { seed: 2, pairCount: 120 })
    expect(a.meanCircuity).toBe(b.meanCircuity)
    // A different seed draws different pairs; if it did not, the seed would be
    // doing nothing and the sample would not be a sample.
    expect(c.pairs.map((p) => p.fromId)).not.toEqual(a.pairs.map((p) => p.fromId))
  })

  it('never reports a mean below one, whatever the seed', () => {
    for (const seed of [1, 7, 99, 12345]) {
      expect(sampledCircuity(gatedCluster(), { seed, pairCount: 80 }).meanCircuity).toBeGreaterThanOrEqual(1)
    }
  })
})
