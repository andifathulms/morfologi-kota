/**
 * Graph construction.
 *
 * Pure, runs in Node: numbers and geometry in, numbers out. No DOM, no React,
 * no clock, no network, no module-level mutable state. That is what makes the
 * synthetic suite possible (PRD §8).
 *
 * Coordinates inside the graph are local metres (`xM` east, `yM` north) about
 * a site centre, not degrees. Projection happens once, at the boundary, so
 * every measure downstream is plane geometry over a sample a kilometre or so
 * across — where the equirectangular error is far below the precision of the
 * underlying OSM geometry.
 */

import { admitsWay, type Mode, type TagMapping, type TaggedWay } from '@/lib/tags'

export interface Point {
  readonly xM: number
  readonly yM: number
}

export interface GraphNode extends Point {
  readonly id: string
}

/**
 * One street segment between two graph nodes. `geometry` runs from `u` to `v`
 * inclusive and carries the interstitial shape points, so a curving segment
 * contributes its true length and its several bearings rather than one chord.
 */
export interface GraphEdge {
  readonly id: string
  readonly u: string
  readonly v: string
  readonly geometry: readonly Point[]
  /** Source OSM way id where there is one; absent for synthetic fixtures. */
  readonly wayId?: number
  /** Raw OSM tags of the source way, kept for the coverage measure. */
  readonly tags?: Readonly<Record<string, string>>
}

export interface StreetGraph {
  readonly nodes: ReadonlyMap<string, GraphNode>
  readonly edges: readonly GraphEdge[]
}

const EARTH_RADIUS_M = 6_371_008.8

/** Metres per degree of longitude at a given latitude. */
export function metresPerLonDeg(latDeg: number): number {
  return (Math.PI / 180) * EARTH_RADIUS_M * Math.cos((latDeg * Math.PI) / 180)
}

/** Metres per degree of latitude. Constant to the precision this project uses. */
export function metresPerLatDeg(): number {
  return (Math.PI / 180) * EARTH_RADIUS_M
}

/** Project lon/lat degrees to local metres about a centre. */
export function projectToLocalM(
  lonDeg: number,
  latDeg: number,
  centreLonDeg: number,
  centreLatDeg: number,
): Point {
  return {
    xM: (lonDeg - centreLonDeg) * metresPerLonDeg(centreLatDeg),
    yM: (latDeg - centreLatDeg) * metresPerLatDeg(),
  }
}

/** Great-circle-equivalent distance for the local plane. */
export function distanceM(a: Point, b: Point): number {
  const dx = b.xM - a.xM
  const dy = b.yM - a.yM
  return Math.sqrt(dx * dx + dy * dy)
}

/** Length of an edge along its full geometry, not its chord. */
export function edgeLengthM(edge: GraphEdge): number {
  let total = 0
  for (let i = 1; i < edge.geometry.length; i += 1) {
    total += distanceM(edge.geometry[i - 1]!, edge.geometry[i]!)
  }
  return total
}

export function totalLengthM(graph: StreetGraph): number {
  return graph.edges.reduce((sum, edge) => sum + edgeLengthM(edge), 0)
}

/**
 * Undirected adjacency, node id → the ids of its neighbours paired with the
 * edge that reaches them. Parallel edges are kept: two distinct ways between
 * the same pair of junctions are two real streets.
 */
export interface Adjacent {
  readonly nodeId: string
  readonly edge: GraphEdge
}

export function buildAdjacency(graph: StreetGraph): ReadonlyMap<string, readonly Adjacent[]> {
  const adjacency = new Map<string, Adjacent[]>()
  for (const id of graph.nodes.keys()) adjacency.set(id, [])
  for (const edge of graph.edges) {
    adjacency.get(edge.u)?.push({ nodeId: edge.v, edge })
    if (edge.u !== edge.v) adjacency.get(edge.v)?.push({ nodeId: edge.u, edge })
  }
  return adjacency
}

/**
 * Node degree, counting edge ends. A self-loop contributes two, which is the
 * convention that keeps the handshake identity — the degree sum is twice the
 * edge count — exact.
 */
export function degreeMap(graph: StreetGraph): ReadonlyMap<string, number> {
  const degrees = new Map<string, number>()
  for (const id of graph.nodes.keys()) degrees.set(id, 0)
  for (const edge of graph.edges) {
    degrees.set(edge.u, (degrees.get(edge.u) ?? 0) + 1)
    degrees.set(edge.v, (degrees.get(edge.v) ?? 0) + 1)
  }
  return degrees
}

export function makeGraph(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): StreetGraph {
  const nodeMap = new Map<string, GraphNode>()
  for (const node of nodes) nodeMap.set(node.id, node)
  for (const edge of edges) {
    if (!nodeMap.has(edge.u)) throw new Error(`edge ${edge.id} references missing node ${edge.u}`)
    if (!nodeMap.has(edge.v)) throw new Error(`edge ${edge.id} references missing node ${edge.v}`)
    if (edge.geometry.length < 2) throw new Error(`edge ${edge.id} has degenerate geometry`)
  }
  return { nodes: nodeMap, edges }
}

/** Drop nodes no edge reaches. Clipping leaves these behind. */
export function pruneIsolatedNodes(graph: StreetGraph): StreetGraph {
  const used = new Set<string>()
  for (const edge of graph.edges) {
    used.add(edge.u)
    used.add(edge.v)
  }
  const nodes = [...graph.nodes.values()].filter((node) => used.has(node.id))
  return makeGraph(nodes, graph.edges)
}

/** An OSM extract reduced to what graph construction needs. */
export interface OsmExtract {
  readonly nodes: ReadonlyMap<number, { readonly lonDeg: number; readonly latDeg: number }>
  readonly ways: readonly TaggedWay[]
}

export interface BuildFromWaysOptions {
  readonly centreLonDeg: number
  readonly centreLatDeg: number
  readonly mode: Mode
  readonly mapping: TagMapping
}

/**
 * OSM ways → a street graph for one mode.
 *
 * Ways are split at every node they share with another admitted way, so graph
 * nodes are junctions and way ends rather than shape points; the shape points
 * between them are kept as edge geometry. This is the standard construction
 * and it is what makes node degree mean intersection degree.
 */
export function buildGraphFromWays(extract: OsmExtract, options: BuildFromWaysOptions): StreetGraph {
  const { centreLonDeg, centreLatDeg, mode, mapping } = options
  const admitted = extract.ways.filter((way) => admitsWay(way, mapping, mode))

  // How many admitted ways touch each node — a node touched more than once, or
  // appearing twice within one way, is a junction.
  const uses = new Map<number, number>()
  for (const way of admitted) {
    const seen = new Set<number>()
    for (const nodeId of way.nodes) {
      uses.set(nodeId, (uses.get(nodeId) ?? 0) + 1)
      if (seen.has(nodeId)) uses.set(nodeId, (uses.get(nodeId) ?? 0) + 1)
      seen.add(nodeId)
    }
  }

  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []

  const pointOf = (osmId: number): Point | undefined => {
    const raw = extract.nodes.get(osmId)
    if (raw === undefined) return undefined
    return projectToLocalM(raw.lonDeg, raw.latDeg, centreLonDeg, centreLatDeg)
  }

  const ensureNode = (osmId: number, point: Point): string => {
    const id = `n${osmId}`
    if (!nodes.has(id)) nodes.set(id, { id, ...point })
    return id
  }

  for (const way of admitted) {
    const present = way.nodes.filter((id) => extract.nodes.has(id))
    if (present.length < 2) continue

    let startIndex = 0
    let geometry: Point[] = []
    const first = pointOf(present[0]!)
    if (first === undefined) continue
    geometry.push(first)

    for (let i = 1; i < present.length; i += 1) {
      const osmId = present[i]!
      const point = pointOf(osmId)
      if (point === undefined) continue
      geometry.push(point)

      const isJunction = (uses.get(osmId) ?? 0) > 1
      const isEnd = i === present.length - 1
      if (!isJunction && !isEnd) continue

      const uOsm = present[startIndex]!
      const u = ensureNode(uOsm, geometry[0]!)
      const v = ensureNode(osmId, point)
      if (geometry.length >= 2) {
        edges.push({
          id: `w${way.id}-${startIndex}-${i}`,
          u,
          v,
          geometry,
          wayId: way.id,
          tags: way.tags,
        })
      }
      startIndex = i
      geometry = [point]
    }
  }

  return pruneIsolatedNodes(makeGraph([...nodes.values()], edges))
}

/**
 * Clip to the fixed sampling radius about the origin of the local frame.
 *
 * An edge is kept when any part of its geometry lies inside the circle, and it
 * is truncated at the boundary so that every site is measured over exactly the
 * same area (PRD §4 — radius changes results, so it is fixed and printed).
 */
export function clipToRadius(graph: StreetGraph, radiusM: number): StreetGraph {
  const inside = (p: Point): boolean => Math.hypot(p.xM, p.yM) <= radiusM
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []

  const addNode = (id: string, point: Point): string => {
    if (!nodes.has(id)) nodes.set(id, { id, ...point })
    return id
  }

  for (const edge of graph.edges) {
    // Split the geometry into the maximal runs that lie inside the circle,
    // interpolating the crossing point on each boundary transition.
    let run: Point[] = []
    let runStartsAtU = false
    let pieceIndex = 0
    const flush = (endsAtV: boolean) => {
      if (run.length >= 2) {
        const uPoint = run[0]!
        const vPoint = run[run.length - 1]!
        const u = runStartsAtU
          ? addNode(edge.u, graph.nodes.get(edge.u) ?? uPoint)
          : addNode(`${edge.id}-c${pieceIndex}u`, uPoint)
        const v = endsAtV
          ? addNode(edge.v, graph.nodes.get(edge.v) ?? vPoint)
          : addNode(`${edge.id}-c${pieceIndex}v`, vPoint)
        edges.push({ ...edge, id: `${edge.id}-c${pieceIndex}`, u, v, geometry: run })
        pieceIndex += 1
      }
      run = []
    }

    for (let i = 0; i < edge.geometry.length; i += 1) {
      const point = edge.geometry[i]!
      const here = inside(point)
      const previous = i > 0 ? edge.geometry[i - 1]! : undefined
      const previousInside = previous !== undefined && inside(previous)

      if (here && (i === 0 || previousInside)) {
        if (run.length === 0) runStartsAtU = i === 0
        run.push(point)
      } else if (here && previous !== undefined) {
        run = [intersectCircle(previous, point, radiusM)]
        runStartsAtU = false
        run.push(point)
      } else if (!here && previousInside && previous !== undefined) {
        run.push(intersectCircle(point, previous, radiusM))
        flush(false)
      }
    }
    flush(true)
  }

  return pruneIsolatedNodes(makeGraph([...nodes.values()], edges))
}

/**
 * The point where segment `outside`→`inside` crosses the circle of `radiusM`
 * about the origin. Bisection: exact enough at metre scale, and free of the
 * quadratic's sign cases.
 */
function intersectCircle(outside: Point, inside: Point, radiusM: number): Point {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2
    const x = outside.xM + (inside.xM - outside.xM) * mid
    const y = outside.yM + (inside.yM - outside.yM) * mid
    if (Math.hypot(x, y) > radiusM) lo = mid
    else hi = mid
  }
  return {
    xM: outside.xM + (inside.xM - outside.xM) * hi,
    yM: outside.yM + (inside.yM - outside.yM) * hi,
  }
}
