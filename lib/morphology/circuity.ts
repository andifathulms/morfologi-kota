/**
 * Circuity — how far the network makes you travel relative to the straight
 * line.
 *
 * Boeing 2019, §"Methods" — "Configuration" reports average circuity as the
 * ratio of network distance to straight-line distance. Two forms are computed
 * here:
 *
 *   - `edgeCircuity`: total edge length ÷ total chord length over all edges.
 *     Boeing's own figure. Cheap, and ≥ 1 because a polyline is never shorter
 *     than its chord.
 *   - `sampledCircuity`: shortest network path ÷ straight-line distance over a
 *     deterministic sample of node pairs. This is the one that separates a
 *     gated cluster from a kampung, because it feels the detour a single
 *     access point forces.
 *
 * Both are ≥ 1 by definition. A value below 1 means the network distance
 * calculation is broken, and the invariant suite asserts it (PRD §8).
 */

import {
  buildAdjacency,
  distanceM,
  edgeLengthM,
  type GraphNode,
  type StreetGraph,
} from './graph'

export function edgeCircuity(graph: StreetGraph): number {
  let network = 0
  let straight = 0
  for (const edge of graph.edges) {
    const u = graph.nodes.get(edge.u)
    const v = graph.nodes.get(edge.v)
    if (u === undefined || v === undefined) continue
    const chord = distanceM(u, v)
    if (chord <= 0) continue // self-loop: no chord to compare against
    network += edgeLengthM(edge)
    straight += chord
  }
  return straight > 0 ? network / straight : 1
}

export interface SampledPair {
  readonly fromId: string
  readonly toId: string
  readonly networkM: number
  readonly straightM: number
  readonly circuity: number
}

export interface SampledCircuity {
  readonly meanCircuity: number
  readonly pairs: readonly SampledPair[]
  /** Pairs drawn but discarded because no path connects them. */
  readonly unreachablePairs: number
}

/**
 * Deterministic pseudo-random source. The bundle must be byte-identical for
 * the same inputs (PRD §8), so the sample may not depend on a clock or on the
 * platform's RNG. A 32-bit linear congruential generator is plenty for
 * choosing node indices.
 */
function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** Minimal binary heap — no dependency, and Dijkstra is the only user. */
class MinHeap {
  private readonly items: { key: number; value: string }[] = []

  push(key: number, value: string): void {
    this.items.push({ key, value })
    let i = this.items.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.items[parent]!.key <= this.items[i]!.key) break
      const tmp = this.items[parent]!
      this.items[parent] = this.items[i]!
      this.items[i] = tmp
      i = parent
    }
  }

  pop(): { key: number; value: string } | undefined {
    const top = this.items[0]
    if (top === undefined) return undefined
    const last = this.items.pop()!
    if (this.items.length > 0) {
      this.items[0] = last
      let i = 0
      for (;;) {
        const left = 2 * i + 1
        const right = left + 1
        let smallest = i
        if (left < this.items.length && this.items[left]!.key < this.items[smallest]!.key)
          smallest = left
        if (right < this.items.length && this.items[right]!.key < this.items[smallest]!.key)
          smallest = right
        if (smallest === i) break
        const tmp = this.items[smallest]!
        this.items[smallest] = this.items[i]!
        this.items[i] = tmp
        i = smallest
      }
    }
    return top
  }

  get size(): number {
    return this.items.length
  }
}

/** Shortest network distance from one node to every reachable node, in metres. */
export function shortestPathLengthsM(
  graph: StreetGraph,
  sourceId: string,
): ReadonlyMap<string, number> {
  const adjacency = buildAdjacency(graph)
  const best = new Map<string, number>([[sourceId, 0]])
  const settled = new Set<string>()
  const queue = new MinHeap()
  queue.push(0, sourceId)

  while (queue.size > 0) {
    const next = queue.pop()!
    if (settled.has(next.value)) continue
    settled.add(next.value)
    for (const { nodeId, edge } of adjacency.get(next.value) ?? []) {
      const candidate = next.key + edgeLengthM(edge)
      if (candidate < (best.get(nodeId) ?? Infinity)) {
        best.set(nodeId, candidate)
        queue.push(candidate, nodeId)
      }
    }
  }
  return best
}

export interface SampleOptions {
  /** How many node pairs to draw. Fixed across the comparison set. */
  readonly pairCount?: number
  /** Seed for the deterministic sample. */
  readonly seed?: number
  /** Pairs closer together than this add noise rather than signal. */
  readonly minStraightM?: number
}

export function sampledCircuity(graph: StreetGraph, options: SampleOptions = {}): SampledCircuity {
  const { pairCount = 500, seed = 20260820, minStraightM = 100 } = options
  const nodes: readonly GraphNode[] = [...graph.nodes.values()].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  )
  if (nodes.length < 2) return { meanCircuity: 1, pairs: [], unreachablePairs: 0 }

  const random = lcg(seed)
  // Group the draws by source so each source needs one Dijkstra run.
  const draws = new Map<string, string[]>()
  for (let i = 0; i < pairCount; i += 1) {
    const from = nodes[Math.floor(random() * nodes.length)]!
    const to = nodes[Math.floor(random() * nodes.length)]!
    if (from.id === to.id) continue
    if (distanceM(from, to) < minStraightM) continue
    const list = draws.get(from.id)
    if (list === undefined) draws.set(from.id, [to.id])
    else list.push(to.id)
  }

  const pairs: SampledPair[] = []
  let unreachablePairs = 0
  for (const [fromId, targets] of [...draws.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const from = graph.nodes.get(fromId)
    if (from === undefined) continue
    const lengths = shortestPathLengthsM(graph, fromId)
    for (const toId of targets) {
      const to = graph.nodes.get(toId)
      const networkM = lengths.get(toId)
      if (to === undefined || networkM === undefined || !Number.isFinite(networkM)) {
        unreachablePairs += 1
        continue
      }
      const straightM = distanceM(from, to)
      if (straightM <= 0) continue
      pairs.push({ fromId, toId, networkM, straightM, circuity: networkM / straightM })
    }
  }

  const meanCircuity =
    pairs.length > 0 ? pairs.reduce((sum, p) => sum + p.circuity, 0) / pairs.length : 1
  return { meanCircuity, pairs, unreachablePairs }
}
