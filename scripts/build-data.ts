/**
 * DEV/CI — cached OSM extracts → clipped sites → both graphs → metrics.
 *
 * BUILD TIME ONLY. This is the whole pipeline: for every site it builds the
 * driving graph and the walking graph under the default tag mapping, clips
 * both to the fixed sampling radius, computes the metric column for each,
 * measures footway coverage, recomputes the headline numbers under every
 * alternative mapping so the sensitivity can be reported, and emits a bundle
 * per site plus a manifest.
 *
 * Nothing is computed in a component (CLAUDE.md, Invariants §16) — the output
 * of this script is what the pages render.
 */

import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildGraphFromWays,
  clipToRadius,
  GRID_ENTROPY,
  MAX_ENTROPY,
  binContributions,
  computeModeMetrics,
  coverageOfWalkGraph,
  edgeLengthM,
  totalLengthM,
  type ModeMetrics,
  type StreetGraph,
} from '@/lib/morphology'
import { DEFAULT_TAG_MAPPING, TAG_MAPPINGS, admitsWay, type Mode, type TagMapping } from '@/lib/tags'
import {
  BOEING_CITATION,
  BOEING_DOI,
  ODBL_ATTRIBUTION,
  MAPPING_EXEMPLAR_SLUGS,
  SAMPLING_RADIUS_M,
  SITES,
  classifyStability,
  manifestSchema,
  referenceSchema,
  siteBundleSchema,
  type ManifestEntry,
  type SensitivitySummaryEntry,
  type EmittedModeMetrics,
  type ReferenceNetwork,
  type SensitivityValues,
  type Site,
  type WalkOnly,
} from '@/data/sites'
import {
  perfectGrid,
  pureTree,
  randomGeometricGraph,
  rotatedGrid,
} from '@/lib/reference/networks'
import { readCachedExtract, splitElements } from './osm'
import { simplifyPolyline } from './simplify'

const OUT_DIR = join(process.cwd(), 'data', 'out')

/** Below a hairline's worth of screen at the size the pair view draws a site. */
const SIMPLIFY_TOLERANCE_M = 2

/**
 * The plate draws a site 200 px across, which is 8 m to the pixel: at that
 * size a 7 m deviation is invisible and a 15 m stub is a dot. Simplifying for
 * the plate separately is the difference between a page of a few hundred
 * kilobytes and one of several megabytes.
 */
const PLATE_TOLERANCE_M = 7
const PLATE_MIN_LENGTH_M = 15

/**
 * The assumptions page draws its comparison discs smaller again — six of them
 * on one page, at roughly 180 px. Coarser than the plate for the same reason
 * the plate is coarser than the pair: below a pixel is below a pixel, and the
 * alternative is a page of several megabytes to show that some lines left.
 */
const COMPARE_TOLERANCE_M = 12
const COMPARE_MIN_LENGTH_M = 30

/**
 * Floats are rounded before they are written. Two machines must produce a
 * byte-identical bundle from the same extract (PRD §8), and the last bits of a
 * double are not something to stake that on.
 */
function round(value: number, places: number): number {
  const factor = 10 ** places
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}

function roundMetrics(metrics: ModeMetrics): EmittedModeMetrics {
  return {
    ...metrics,
    rose: {
      binCentresDeg: [...metrics.rose.binCentresDeg],
      shares: metrics.rose.shares.map((share) => round(share, 8)),
      binContributions: binContributions(metrics.rose).map((term) => round(term, 8)),
      totalWeight: round(metrics.rose.totalWeight, 3),
    },
    orientationEntropy: round(metrics.orientationEntropy, 6),
    normalisedEntropy: round(metrics.normalisedEntropy, 6),
    orientationOrder: round(metrics.orientationOrder, 6),
    edgeCircuity: round(metrics.edgeCircuity, 6),
    sampledCircuity: round(metrics.sampledCircuity, 6),
    degrees: {
      ...metrics.degrees,
      averageDegree: round(metrics.degrees.averageDegree, 6),
      proportions: {
        deadEnd: round(metrics.degrees.proportions.deadEnd, 6),
        through: round(metrics.degrees.proportions.through, 6),
        threeWay: round(metrics.degrees.proportions.threeWay, 6),
        fourWay: round(metrics.degrees.proportions.fourWay, 6),
        fivePlus: round(metrics.degrees.proportions.fivePlus, 6),
      },
    },
    intersectionDensityPerKm2: round(metrics.intersectionDensityPerKm2, 3),
    medianSegmentLengthM: round(metrics.medianSegmentLengthM, 2),
    totalLengthM: round(metrics.totalLengthM, 2),
  }
}

/**
 * Drawing geometry: simplified, rounded to the metre, one array per edge.
 *
 * `edgeIndex` maps each emitted line back to the graph edge it came from. The
 * plate and comparison scales drop sub-pixel stubs, so the emitted array is
 * shorter than the edge list and positional correspondence is lost — and
 * `walkOnly.plateIndices` has to index the array that is actually drawn.
 */
interface EmittedGeometry {
  readonly lines: [number, number][][]
  readonly edgeIndex: number[]
}

function emitGeometryIndexed(
  graph: StreetGraph,
  toleranceM: number,
  minLengthM: number,
): EmittedGeometry {
  const lines: [number, number][][] = []
  const edgeIndex: number[] = []
  graph.edges.forEach((edge, index) => {
    const line = simplifyPolyline(edge.geometry, toleranceM).map(
      (point) => [round(point.xM, 1), round(point.yM, 1)] as [number, number],
    )
    if (minLengthM > 0) {
      let length = 0
      for (let i = 1; i < line.length; i += 1) {
        const a = line[i - 1]
        const b = line[i]
        if (a === undefined || b === undefined) continue
        length += Math.hypot(b[0] - a[0], b[1] - a[1])
      }
      if (length < minLengthM) return
    }
    lines.push(line)
    edgeIndex.push(index)
  })
  return { lines, edgeIndex }
}

function emitGeometry(graph: StreetGraph): EmittedGeometry {
  return emitGeometryIndexed(graph, SIMPLIFY_TOLERANCE_M, 0)
}

/** The same geometry at plate scale, with sub-pixel stubs dropped. */
function emitPlateGeometry(graph: StreetGraph): EmittedGeometry {
  return emitGeometryIndexed(graph, PLATE_TOLERANCE_M, PLATE_MIN_LENGTH_M)
}

/** Coarser again, for the six discs the assumptions page draws side by side. */
function emitCompareGeometry(graph: StreetGraph): [number, number][][] {
  return emitGeometryIndexed(graph, COMPARE_TOLERANCE_M, COMPARE_MIN_LENGTH_M).lines
}

/**
 * Which walking edges the driving network does not contain.
 *
 * Decided by the tag rule, never by geometry: an edge is walk-only when the
 * OSM way it came from is not admitted to the driving network under this
 * mapping. `admitsWay` is the same function the graph builder used, so the
 * answer is the graph's own definition rather than a second opinion about it —
 * and a reader can follow the number back to a named constant in `lib/tags`.
 *
 * Comparing the two graphs edge-for-edge would not have worked: they are built
 * independently, the walk graph admits more ways, so it splits at more
 * junctions and its edge ids are not the drive graph's. Way membership is the
 * only correspondence that survives, and it is also the one the mapping
 * actually decides.
 */
function walkOnlyOf(
  walkGraph: StreetGraph,
  mapping: TagMapping,
  full: EmittedGeometry,
  plate: EmittedGeometry,
): WalkOnly {
  const isWalkOnly = walkGraph.edges.map(
    (edge) => !admitsWay({ id: edge.wayId ?? 0, tags: edge.tags ?? {}, nodes: [] }, mapping, 'drive'),
  )

  let lengthM = 0
  walkGraph.edges.forEach((edge, index) => {
    if (isWalkOnly[index] === true) lengthM += edgeLengthM(edge)
  })
  const walkLengthM = totalLengthM(walkGraph)

  const pick = (emitted: EmittedGeometry): number[] => {
    const indices: number[] = []
    emitted.edgeIndex.forEach((edgeIdx, position) => {
      if (isWalkOnly[edgeIdx] === true) indices.push(position)
    })
    return indices
  }

  return {
    indices: pick(full),
    plateIndices: pick(plate),
    lengthM: round(lengthM, 2),
    shareOfWalk: round(walkLengthM > 0 ? lengthM / walkLengthM : 0, 6),
  }
}

/** Everything the sensitivity summary tracks, pulled off a metric column. */
function sensitivityValues(metrics: ModeMetrics): SensitivityValues {
  return {
    orientationEntropy: round(metrics.orientationEntropy, 6),
    orientationOrder: round(metrics.orientationOrder, 6),
    sampledCircuity: round(metrics.sampledCircuity, 6),
    averageDegree: round(metrics.degrees.averageDegree, 6),
    fourWayProportion: round(metrics.degrees.proportions.fourWay, 6),
    deadEndProportion: round(metrics.degrees.proportions.deadEnd, 6),
    intersectionDensityPerKm2: round(metrics.intersectionDensityPerKm2, 3),
    medianSegmentLengthM: round(metrics.medianSegmentLengthM, 2),
    totalLengthM: round(metrics.totalLengthM, 2),
  }
}

const SENSITIVITY_METRICS = [
  'orientationEntropy',
  'orientationOrder',
  'sampledCircuity',
  'averageDegree',
  'fourWayProportion',
  'deadEndProportion',
  'intersectionDensityPerKm2',
  'medianSegmentLengthM',
  'totalLengthM',
] as const satisfies readonly (keyof SensitivityValues)[]

interface ModeResult {
  readonly graph: StreetGraph
  readonly metrics: ModeMetrics
}

function buildMode(
  extract: ReturnType<typeof splitElements>,
  site: Site,
  mode: Mode,
  mapping: TagMapping,
): ModeResult {
  const graph = clipToRadius(
    buildGraphFromWays(
      { nodes: extract.nodes, ways: extract.ways },
      {
        centreLonDeg: site.centreLonDeg,
        centreLatDeg: site.centreLatDeg,
        mode,
        mapping,
      },
    ),
    SAMPLING_RADIUS_M,
  )
  return { graph, metrics: computeModeMetrics(graph, { radiusM: SAMPLING_RADIUS_M }) }
}

/**
 * The reference networks, measured by the same code that measures a site.
 *
 * A reader has no scale for H until they have seen one. These are the known
 * answers — a perfect grid at ln 4, the same grid rotated 29° at the *same*
 * entropy with shifted bins, a random graph near ln 36, a pure tree — put
 * through `computeModeMetrics` exactly as a real disc is, so the number beside
 * a reference rose is comparable with the number beside a real one.
 *
 * The rotated grid is the one that teaches the most in one glance: identical H,
 * different bins. That is rotation-invariance, and it is Boeing's Manhattan.
 */
function buildReference(): ReferenceNetwork[] {
  const tree = pureTree()
  const specs = [
    {
      id: 'perfect-grid' as const,
      graph: perfectGrid(),
      label: { id: 'Petak sempurna', en: 'Perfect grid' },
      note: {
        id: 'Panjang yang sama membentang utara–selatan dan timur–barat: empat bin terisi, sisanya kosong.',
        en: 'Equal length running north–south and east–west: four bins occupied, the rest empty.',
      },
      expected: { id: 'H = ln 4 ≈ 1,386 · φ = 1', en: 'H = ln 4 ≈ 1.386 · φ = 1' },
    },
    {
      id: 'rotated-grid' as const,
      graph: rotatedGrid(29),
      label: { id: 'Petak yang sama, diputar 29°', en: 'The same grid, rotated 29°' },
      note: {
        id: 'Bentuk yang sama persis, diputar. Entropinya tidak berubah — hanya binnya yang bergeser. Inilah yang dimaksud ukuran ini tidak bergantung pada arah hadap kota, dan inilah Manhattan pada 29° dalam makalah Boeing.',
        en: 'Exactly the same shape, turned. The entropy does not move — only the bins do. That is what it means for the measure to be rotation-invariant, and it is Boeing’s Manhattan at 29°.',
      },
      expected: {
        id: 'H sama dengan petak di sebelah kiri',
        en: 'H identical to the grid on its left',
      },
    },
    {
      id: 'random-geometric' as const,
      graph: randomGeometricGraph(),
      label: { id: 'Graf geometrik acak', en: 'Random geometric graph' },
      note: {
        id: 'Titik acak yang dihubungkan bila berdekatan: arah jalan hampir merata, jadi entropinya mendekati maksimum.',
        en: 'Random points joined when close: bearings are near-uniform, so entropy sits near its maximum.',
      },
      expected: { id: 'H mendekati ln 36 ≈ 3,584', en: 'H approaching ln 36 ≈ 3.584' },
    },
    {
      id: 'pure-tree' as const,
      graph: tree.graph,
      label: { id: 'Pohon murni', en: 'Pure tree' },
      note: {
        id: 'Tidak ada satu pun putaran: setiap cabang berakhir buntu. Proporsi jalan buntunya diketahui dari konstruksinya.',
        en: 'Not one loop: every branch ends in a dead end. Its dead-end proportion is known from its construction.',
      },
      expected: {
        id: `jalan buntu = ${(tree.expectedDeadEndProportion * 100).toFixed(1)}% menurut konstruksi`,
        en: `dead-end = ${(tree.expectedDeadEndProportion * 100).toFixed(1)}% by construction`,
      },
    },
  ]

  return specs.map((spec) => {
    let radiusM = 1
    for (const node of spec.graph.nodes.values()) {
      radiusM = Math.max(radiusM, Math.hypot(node.xM, node.yM))
    }
    const metrics = computeModeMetrics(spec.graph, { radiusM })
    return {
      id: spec.id,
      label: spec.label,
      note: spec.note,
      expected: spec.expected,
      rose: {
        binCentresDeg: [...metrics.rose.binCentresDeg],
        shares: metrics.rose.shares.map((share) => round(share, 8)),
        binContributions: binContributions(metrics.rose).map((term) => round(term, 8)),
        totalWeight: round(metrics.rose.totalWeight, 3),
      },
      orientationEntropy: round(metrics.orientationEntropy, 6),
      normalisedEntropy: round(metrics.normalisedEntropy, 6),
      orientationOrder: round(metrics.orientationOrder, 6),
      deadEndProportion: round(metrics.degrees.proportions.deadEnd, 6),
      radiusM: round(radiusM, 2),
      geometry: emitGeometryIndexed(spec.graph, COMPARE_TOLERANCE_M, 0).lines,
    }
  })
}

async function main(): Promise<void> {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  console.log(`Building ${SITES.length} sites at r=${SAMPLING_RADIUS_M} m, 36 bins, both modes.`)
  console.log(`Tag mapping: ${DEFAULT_TAG_MAPPING.id}. Sensitivity over ${TAG_MAPPINGS.length}.\n`)

  const manifestSites: ManifestEntry[] = []
  const extractVersions = new Set<string>()
  const sensitivityBySite: {
    slug: string
    byMapping: Map<string, { drive: SensitivityValues; walk: SensitivityValues }>
  }[] = []

  for (const site of SITES) {
    const cached = await readCachedExtract(site.slug)
    extractVersions.add(cached.timestampOsmBase)
    const extract = splitElements(cached.response)

    const drive = buildMode(extract, site, 'drive', DEFAULT_TAG_MAPPING)
    const walk = buildMode(extract, site, 'walk', DEFAULT_TAG_MAPPING)
    const coverage = coverageOfWalkGraph(walk.graph, SAMPLING_RADIUS_M)

    // Sensitivity: the same headline numbers under every mapping. Reported,
    // never asserted — the numbers legitimately move (PRD §8).
    const sensitivity = TAG_MAPPINGS.map((mapping) => {
      const d =
        mapping.id === DEFAULT_TAG_MAPPING.id
          ? drive.metrics
          : buildMode(extract, site, 'drive', mapping).metrics
      const w =
        mapping.id === DEFAULT_TAG_MAPPING.id
          ? walk.metrics
          : buildMode(extract, site, 'walk', mapping).metrics
      return {
        mappingId: mapping.id,
        drive: sensitivityValues(d),
        walk: sensitivityValues(w),
      }
    })

    sensitivityBySite.push({
      slug: site.slug,
      byMapping: new Map(
        sensitivity.map((entry) => [entry.mappingId, { drive: entry.drive, walk: entry.walk }]),
      ),
    })

    const walkFull = emitGeometry(walk.graph)
    const walkPlate = emitPlateGeometry(walk.graph)
    const walkOnly = walkOnlyOf(walk.graph, DEFAULT_TAG_MAPPING, walkFull, walkPlate)

    /*
     * The same disc under every mapping, for the two exemplar sites only.
     * Plate-scale geometry is most of a bundle, so this is deliberately not
     * done for the whole set (PRD §6.5; `MAPPING_EXEMPLAR_SLUGS`).
     */
    const alternateGeometry = MAPPING_EXEMPLAR_SLUGS.includes(site.slug)
      ? TAG_MAPPINGS.map((mapping) => {
          const d = mapping.id === DEFAULT_TAG_MAPPING.id ? drive : buildMode(extract, site, 'drive', mapping)
          const w = mapping.id === DEFAULT_TAG_MAPPING.id ? walk : buildMode(extract, site, 'walk', mapping)
          return {
            mappingId: mapping.id,
            drivePlateGeometry: emitCompareGeometry(d.graph),
            walkPlateGeometry: emitCompareGeometry(w.graph),
            driveTotalLengthM: round(d.metrics.totalLengthM, 2),
            walkTotalLengthM: round(w.metrics.totalLengthM, 2),
          }
        })
      : undefined

    const bundle = siteBundleSchema.parse({
      site,
      radiusM: SAMPLING_RADIUS_M,
      mappingId: DEFAULT_TAG_MAPPING.id,
      extractVersion: cached.timestampOsmBase,
      drive: {
        metrics: roundMetrics(drive.metrics),
        geometry: emitGeometry(drive.graph).lines,
        plateGeometry: emitPlateGeometry(drive.graph).lines,
      },
      walk: {
        metrics: roundMetrics(walk.metrics),
        geometry: walkFull.lines,
        plateGeometry: walkPlate.lines,
      },
      walkOnly,
      ...(alternateGeometry === undefined ? {} : { alternateGeometry }),
      coverage: {
        pedestrianShare: round(coverage.pedestrianShare, 6),
        pedestrianLengthM: round(coverage.pedestrianLengthM, 2),
        walkLengthM: round(coverage.walkLengthM, 2),
        pedestrianDensityMPerKm2: round(coverage.pedestrianDensityMPerKm2, 2),
        confidence: {
          type: coverage.confidence.type,
          pedestrianShare: round(coverage.confidence.pedestrianShare, 6),
        },
      },
      sensitivity,
      attribution: ODBL_ATTRIBUTION,
      licence: 'ODbL-1.0',
    })

    await writeFile(join(OUT_DIR, `${site.slug}.json`), JSON.stringify(bundle), 'utf8')

    manifestSites.push({
      slug: site.slug,
      name: site.name,
      city: site.city,
      type: site.type,
      centreLatDeg: site.centreLatDeg,
      centreLonDeg: site.centreLonDeg,
      note: site.note,
      radiusM: SAMPLING_RADIUS_M,
      coverage: bundle.coverage,
      drive: bundle.drive.metrics,
      walk: bundle.walk.metrics,
      walkOnly: { lengthM: walkOnly.lengthM, shareOfWalk: walkOnly.shareOfWalk },
      extractVersion: cached.timestampOsmBase,
    })

    const flag = coverage.confidence.type === 'thin' ? '  ⚑ thin footway coverage' : ''
    console.log(
      `${site.slug.padEnd(24)} H drive ${bundle.drive.metrics.orientationEntropy.toFixed(3)}` +
        `  H walk ${bundle.walk.metrics.orientationEntropy.toFixed(3)}` +
        `  cov ${(coverage.pedestrianShare * 100).toFixed(1)}%` +
        `  walk-only ${(walkOnly.lengthM / 1000).toFixed(1)} km${flag}`,
    )
  }

  /*
   * Which metrics survive a change of tag mapping.
   *
   * A statement about the method rather than about any site: it tells a reader
   * which numbers can be compared across sites without knowing the mapping,
   * and which only mean anything stated alongside it. The per-site numbers are
   * already emitted; this is the summary a reader would otherwise have to
   * assemble by eye from three tables (PRD §8 — sensitivity is reported).
   */
  const sensitivitySummary: SensitivitySummaryEntry[] = []
  for (const mapping of TAG_MAPPINGS) {
    if (mapping.id === DEFAULT_TAG_MAPPING.id) continue
    for (const mode of ['drive', 'walk'] as const) {
      for (const metric of SENSITIVITY_METRICS) {
        let absoluteSum = 0
        let maxAbsolute = 0
        let relativeSum = 0
        let relativeCount = 0
        let worstSlug = ''

        for (const record of sensitivityBySite) {
          const base = record.byMapping.get(DEFAULT_TAG_MAPPING.id)?.[mode]
          const other = record.byMapping.get(mapping.id)?.[mode]
          if (base === undefined || other === undefined) continue
          const change = Math.abs(other[metric] - base[metric])
          absoluteSum += change
          if (change > maxAbsolute) {
            maxAbsolute = change
            worstSlug = record.slug
          }
          if (Math.abs(base[metric]) > 1e-9) {
            relativeSum += change / Math.abs(base[metric])
            relativeCount += 1
          }
        }

        const siteCount = sensitivityBySite.length
        const meanRelativeChange = relativeCount > 0 ? relativeSum / relativeCount : 0
        sensitivitySummary.push({
          metric,
          mode,
          mappingId: mapping.id,
          meanAbsoluteChange: round(siteCount > 0 ? absoluteSum / siteCount : 0, 6),
          maxAbsoluteChange: round(maxAbsolute, 6),
          meanRelativeChange: round(meanRelativeChange, 6),
          worstSlug,
          stability: classifyStability(meanRelativeChange),
        })
      }
    }
  }

  const manifest = manifestSchema.parse({
    radiusM: SAMPLING_RADIUS_M,
    mappingId: DEFAULT_TAG_MAPPING.id,
    extractVersion: [...extractVersions].sort().join(' / '),
    binCount: 36,
    method: { citation: BOEING_CITATION, doi: BOEING_DOI },
    attribution: ODBL_ATTRIBUTION,
    licence: 'ODbL-1.0',
    sites: manifestSites,
    sensitivitySummary,
  })

  await writeFile(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest), 'utf8')

  const reference = referenceSchema.parse({
    binCount: 36,
    gridEntropy: round(GRID_ENTROPY, 6),
    maxEntropy: round(MAX_ENTROPY, 6),
    networks: buildReference(),
  })
  await writeFile(join(OUT_DIR, 'reference.json'), JSON.stringify(reference), 'utf8')
  for (const network of reference.networks) {
    console.log(
      `reference ${network.id.padEnd(18)} H ${network.orientationEntropy.toFixed(3)}` +
        `  φ ${network.orientationOrder.toFixed(3)}  (${network.expected.en})`,
    )
  }
  console.log(`\nWrote ${SITES.length} bundles + manifest to data/out.`)
  console.log('Next: pnpm data:validate')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
