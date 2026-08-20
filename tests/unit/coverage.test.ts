/**
 * Coverage confidence is what stands between a missing survey and a false
 * finding, so its thresholds and its exhaustive handling are pinned.
 */

import { describe, expect, it } from 'vitest'
import {
  GOOD_COVERAGE_THRESHOLD,
  THIN_COVERAGE_THRESHOLD,
  classifyCoverage,
  coverageOfWalkGraph,
  isThin,
  makeGraph,
} from '@/lib/morphology'

describe('classification', () => {
  it('flags anything below the thin threshold', () => {
    expect(classifyCoverage(0).type).toBe('thin')
    expect(classifyCoverage(THIN_COVERAGE_THRESHOLD - 0.001).type).toBe('thin')
    expect(isThin(classifyCoverage(0.01))).toBe(true)
  })

  it('calls the middle band moderate', () => {
    expect(classifyCoverage(THIN_COVERAGE_THRESHOLD).type).toBe('moderate')
    expect(classifyCoverage(GOOD_COVERAGE_THRESHOLD - 0.001).type).toBe('moderate')
    expect(isThin(classifyCoverage(0.2))).toBe(false)
  })

  it('calls the top band good', () => {
    expect(classifyCoverage(GOOD_COVERAGE_THRESHOLD).type).toBe('good')
    expect(classifyCoverage(1).type).toBe('good')
  })
})

describe('coverage of a walking graph', () => {
  const nodes = [
    { id: 'a', xM: 0, yM: 0 },
    { id: 'b', xM: 100, yM: 0 },
    { id: 'c', xM: 100, yM: 100 },
  ]

  it('is the pedestrian-only share of walking-network length', () => {
    const graph = makeGraph(nodes, [
      {
        id: 'road',
        u: 'a',
        v: 'b',
        geometry: [nodes[0]!, nodes[1]!],
        tags: { highway: 'residential' },
      },
      {
        id: 'gang',
        u: 'b',
        v: 'c',
        geometry: [nodes[1]!, nodes[2]!],
        tags: { highway: 'footway' },
      },
    ])
    const coverage = coverageOfWalkGraph(graph, 800)
    expect(coverage.pedestrianShare).toBeCloseTo(0.5, 9)
    expect(coverage.pedestrianLengthM).toBeCloseTo(100, 6)
    expect(coverage.walkLengthM).toBeCloseTo(200, 6)
    expect(coverage.confidence.type).toBe('good')
  })

  it('reports zero rather than NaN for an empty graph', () => {
    const coverage = coverageOfWalkGraph({ nodes: new Map(), edges: [] }, 800)
    expect(coverage.pedestrianShare).toBe(0)
    expect(coverage.confidence.type).toBe('thin')
  })

  it('reads a site with no gang mapped as thin, not as a finding', () => {
    const graph = makeGraph(nodes, [
      {
        id: 'road',
        u: 'a',
        v: 'b',
        geometry: [nodes[0]!, nodes[1]!],
        tags: { highway: 'residential' },
      },
    ])
    expect(coverageOfWalkGraph(graph, 800).confidence.type).toBe('thin')
  })
})
