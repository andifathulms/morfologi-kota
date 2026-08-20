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
  computeModeMetrics,
  coverageOfWalkGraph,
  type ModeMetrics,
  type StreetGraph,
} from '@/lib/morphology'
import { DEFAULT_TAG_MAPPING, TAG_MAPPINGS, type Mode, type TagMapping } from '@/lib/tags'
import {
  BOEING_CITATION,
  BOEING_DOI,
  ODBL_ATTRIBUTION,
  SAMPLING_RADIUS_M,
  SITES,
  classifyStability,
  manifestSchema,
  siteBundleSchema,
  type ManifestEntry,
  type SensitivitySummaryEntry,
  type SensitivityValues,
  type Site,
} from '@/data/sites'
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
 * Floats are rounded before they are written. Two machines must produce a
 * byte-identical bundle from the same extract (PRD §8), and the last bits of a
 * double are not something to stake that on.
 */
function round(value: number, places: number): number {
  const factor = 10 ** places
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}

function roundMetrics(metrics: ModeMetrics): ModeMetrics {
  return {
    ...metrics,
    rose: {
      binCentresDeg: metrics.rose.binCentresDeg,
      shares: metrics.rose.shares.map((share) => round(share, 8)),
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

/** Drawing geometry: simplified, rounded to the metre, one array per edge. */
function emitGeometry(graph: StreetGraph, toleranceM = SIMPLIFY_TOLERANCE_M): [number, number][][] {
  return graph.edges.map((edge) =>
    simplifyPolyline(edge.geometry, toleranceM).map(
      (point) => [round(point.xM, 1), round(point.yM, 1)] as [number, number],
    ),
  )
}

/** The same geometry at plate scale, with sub-pixel stubs dropped. */
function emitPlateGeometry(graph: StreetGraph): [number, number][][] {
  return emitGeometry(graph, PLATE_TOLERANCE_M).filter((line) => {
    let length = 0
    for (let i = 1; i < line.length; i += 1) {
      const a = line[i - 1]
      const b = line[i]
      if (a === undefined || b === undefined) continue
      length += Math.hypot(b[0] - a[0], b[1] - a[1])
    }
    return length >= PLATE_MIN_LENGTH_M
  })
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

    const bundle = siteBundleSchema.parse({
      site,
      radiusM: SAMPLING_RADIUS_M,
      mappingId: DEFAULT_TAG_MAPPING.id,
      drive: {
        metrics: roundMetrics(drive.metrics),
        geometry: emitGeometry(drive.graph),
        plateGeometry: emitPlateGeometry(drive.graph),
      },
      walk: {
        metrics: roundMetrics(walk.metrics),
        geometry: emitGeometry(walk.graph),
        plateGeometry: emitPlateGeometry(walk.graph),
      },
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
    })

    const flag = coverage.confidence.type === 'thin' ? '  ⚑ thin footway coverage' : ''
    console.log(
      `${site.slug.padEnd(24)} H drive ${bundle.drive.metrics.orientationEntropy.toFixed(3)}` +
        `  H walk ${bundle.walk.metrics.orientationEntropy.toFixed(3)}` +
        `  cov ${(coverage.pedestrianShare * 100).toFixed(1)}%${flag}`,
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
  console.log(`\nWrote ${SITES.length} bundles + manifest to data/out.`)
  console.log('Next: pnpm data:validate')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
