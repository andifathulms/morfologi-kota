/**
 * Networks with known morphology.

 * These began as test fixtures and they are still exactly that — the synthetic
 * suite is their first job. They live in `lib/` rather than `tests/` because
 * they have a second job now: a reader has no way to tell whether H = 3.265 is
 * a high number or a low one, and the honest answer is a perfect grid at
 * ln 4 ≈ 1.386 and a random graph near ln 36 ≈ 3.584, drawn beside it.
 *
 * A reference network the build already asserts the answer for is the only
 * kind worth shipping: the calibration a reader sees is the calibration CI
 * checks.
 *
 * Pure, deterministic, no clock and no network — the same constraints as
 * `lib/morphology`, which is what lets the pipeline emit them.
 *
 * No data oracle is needed, because networks whose answers are known by
 * construction can be built (PRD §8). These fixtures are permanent: a perfect
 * square grid gives four populated bins and minimum entropy, the same grid
 * rotated 29° gives identical entropy with shifted bins, a random geometric
 * graph gives near-maximum entropy, and a pure tree gives its constructed
 * dead-end proportion exactly.
 *
 * Everything here is deterministic. The random geometric graph uses a seeded
 * generator so the suite cannot flake.
 */

import { makeGraph, type GraphEdge, type GraphNode, type Point, type StreetGraph } from '@/lib/morphology'

/** Deterministic 32-bit LCG — the same one the circuity sampler uses. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** Rotate a point clockwise about the origin, so bearings advance by `deg`. */
export function rotatePoint(point: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    xM: point.xM * cos + point.yM * sin,
    yM: -point.xM * sin + point.yM * cos,
  }
}

export function rotateGraph(graph: StreetGraph, deg: number): StreetGraph {
  const nodes: GraphNode[] = [...graph.nodes.values()].map((node) => ({
    id: node.id,
    ...rotatePoint(node, deg),
  }))
  const edges: GraphEdge[] = graph.edges.map((edge) => ({
    ...edge,
    geometry: edge.geometry.map((p) => rotatePoint(p, deg)),
  }))
  return makeGraph(nodes, edges)
}

export interface GridOptions {
  /** Streets per side. `cells = streets - 1` blocks. */
  readonly streets?: number
  readonly spacingM?: number
}

/**
 * A perfect square grid: equal length running north–south and east–west, so
 * the length-weighted rose has exactly four equally occupied bins and
 * H = ln 4, φ = 1.
 */
export function perfectGrid(options: GridOptions = {}): StreetGraph {
  const { streets = 9, spacingM = 100 } = options
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const id = (i: number, j: number) => `g${i}_${j}`

  for (let i = 0; i < streets; i += 1) {
    for (let j = 0; j < streets; j += 1) {
      nodes.push({ id: id(i, j), xM: i * spacingM, yM: j * spacingM })
    }
  }
  const at = (i: number, j: number): Point => ({ xM: i * spacingM, yM: j * spacingM })

  for (let i = 0; i < streets; i += 1) {
    for (let j = 0; j < streets; j += 1) {
      if (i + 1 < streets) {
        edges.push({
          id: `h${i}_${j}`,
          u: id(i, j),
          v: id(i + 1, j),
          geometry: [at(i, j), at(i + 1, j)],
        })
      }
      if (j + 1 < streets) {
        edges.push({
          id: `v${i}_${j}`,
          u: id(i, j),
          v: id(i, j + 1),
          geometry: [at(i, j), at(i, j + 1)],
        })
      }
    }
  }
  return makeGraph(nodes, edges)
}

/** The same grid, rotated. Boeing's Manhattan sits at 29°; so does this. */
export function rotatedGrid(deg = 29, options: GridOptions = {}): StreetGraph {
  return rotateGraph(perfectGrid(options), deg)
}

export interface RandomGeometricOptions {
  readonly nodeCount?: number
  readonly extentM?: number
  readonly connectRadiusM?: number
  readonly seed?: number
}

/**
 * A random geometric graph: points scattered uniformly, joined when closer
 * than a radius. Bearings are near-uniform, so entropy sits near its maximum.
 */
export function randomGeometricGraph(options: RandomGeometricOptions = {}): StreetGraph {
  const { nodeCount = 300, extentM = 1000, connectRadiusM = 110, seed = 424242 } = options
  const random = seededRandom(seed)
  const nodes: GraphNode[] = []
  for (let i = 0; i < nodeCount; i += 1) {
    nodes.push({ id: `r${i}`, xM: random() * extentM, yM: random() * extentM })
  }
  const edges: GraphEdge[] = []
  for (let i = 0; i < nodeCount; i += 1) {
    for (let j = i + 1; j < nodeCount; j += 1) {
      const a = nodes[i]!
      const b = nodes[j]!
      if (Math.hypot(b.xM - a.xM, b.yM - a.yM) <= connectRadiusM) {
        edges.push({ id: `e${i}_${j}`, u: a.id, v: b.id, geometry: [a, b] })
      }
    }
  }
  return makeGraph(nodes, edges)
}

export interface TreeOptions {
  /** Depth in levels, root inclusive. */
  readonly depth?: number
  readonly branching?: number
  readonly spacingM?: number
  readonly seed?: number
}

export interface TreeFixture {
  readonly graph: StreetGraph
  /** Dead-end proportion the construction guarantees, computed combinatorially. */
  readonly expectedDeadEndProportion: number
  readonly leafCount: number
  readonly nodeCount: number
}

/**
 * A pure tree — every node reachable one way only, as a cul-de-sac layout is.
 * The dead-end proportion is leaves ÷ nodes and is known before any code runs.
 * Branch bearings are drawn from the seeded generator so the tree is not
 * accidentally a grid.
 */
export function pureTree(options: TreeOptions = {}): TreeFixture {
  const { depth = 7, branching = 2, spacingM = 60, seed = 7777 } = options
  const random = seededRandom(seed)
  const nodes: GraphNode[] = [{ id: 't0', xM: 0, yM: 0 }]
  const edges: GraphEdge[] = []
  let nextId = 1
  let frontier: GraphNode[] = [nodes[0]!]

  for (let level = 1; level < depth; level += 1) {
    const next: GraphNode[] = []
    for (const parent of frontier) {
      for (let b = 0; b < branching; b += 1) {
        const bearingRad = random() * 2 * Math.PI
        const child: GraphNode = {
          id: `t${nextId}`,
          xM: parent.xM + Math.sin(bearingRad) * spacingM,
          yM: parent.yM + Math.cos(bearingRad) * spacingM,
        }
        nextId += 1
        nodes.push(child)
        edges.push({
          id: `te${parent.id}_${child.id}`,
          u: parent.id,
          v: child.id,
          geometry: [parent, child],
        })
        next.push(child)
      }
    }
    frontier = next
  }

  const leafCount = frontier.length
  const nodeCount = nodes.length
  return {
    graph: makeGraph(nodes, edges),
    expectedDeadEndProportion: leafCount / nodeCount,
    leafCount,
    nodeCount,
  }
}

/**
 * A gated cluster: one spine off a through road, with cul-de-sac branches and
 * a single access point. Not a known-answer fixture — it is the shape the
 * project claims to be able to tell apart from a grid, kept here so that claim
 * is exercised rather than assumed.
 */
export function gatedCluster(options: { readonly seed?: number } = {}): StreetGraph {
  const { seed = 31415 } = options
  const random = seededRandom(seed)
  const nodes: GraphNode[] = [{ id: 'gate', xM: 0, yM: 0 }]
  const edges: GraphEdge[] = []
  let previous = nodes[0]!
  let nextId = 0

  for (let i = 1; i <= 12; i += 1) {
    const spine: GraphNode = { id: `s${i}`, xM: i * 80, yM: Math.sin(i / 2) * 40 }
    nodes.push(spine)
    edges.push({ id: `se${i}`, u: previous.id, v: spine.id, geometry: [previous, spine] })
    for (let b = 0; b < 3; b += 1) {
      const angle = (random() - 0.5) * Math.PI + (b % 2 === 0 ? Math.PI / 2 : -Math.PI / 2)
      const leaf: GraphNode = {
        id: `c${nextId}`,
        xM: spine.xM + Math.sin(angle) * 70,
        yM: spine.yM + Math.cos(angle) * 70,
      }
      nextId += 1
      nodes.push(leaf)
      edges.push({ id: `ce${leaf.id}`, u: spine.id, v: leaf.id, geometry: [spine, leaf] })
    }
    previous = spine
  }
  return makeGraph(nodes, edges)
}
