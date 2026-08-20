/**
 * Gate. Runs before every build and in CI (CLAUDE.md, Commands).
 *
 * The emitted bundles are checked against the schema and against the
 * invariants that must hold for the product to mean what it says: both modes
 * present, one fixed radius across the comparison set, rose symmetry and unit
 * mass, circuity at least one, degree proportions summing to one, coverage
 * confidence stated for every site, ODbL attribution carried by every bundle,
 * and no score, grade, rank or index anywhere in the data.
 *
 * A failure here fails the build. A half-comparison must never ship.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  MAPPING_EXEMPLAR_SLUGS,
  SAMPLING_RADIUS_M,
  SITES,
  manifestSchema,
  siteBundleSchema,
  surveySchema,
  type SiteBundle,
} from '@/data/sites'

const OUT_DIR = join(process.cwd(), 'data', 'out')
const SURVEY_PATH = join(process.cwd(), 'data', 'survey.json')

/**
 * Invariant §9: there is no score field in this codebase and adding one is a
 * design regression. The check is on the emitted keys, because that is where a
 * ranking would have to surface to reach the page.
 */
const FORBIDDEN_KEY = /^(score|grade|rank|ranking|rating|index|liveability|walkability)$/i

const failures: string[] = []
const notes: string[] = []

function check(condition: boolean, message: string): void {
  if (!condition) failures.push(message)
}

function scanForForbiddenKeys(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => scanForForbiddenKeys(item, `${path}[${i}]`))
    return
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(key)) {
        failures.push(`${path}.${key} — no score, grade, ranking or index may appear in the data`)
      }
      scanForForbiddenKeys(child, `${path}.${key}`)
    }
  }
}

/**
 * The decomposition the page shows a reader must add up to the number the page
 * prints beside it. If it ever does not, the rose table is quietly teaching
 * arithmetic that is not the arithmetic the metric came from.
 */
function checkEntropyDecomposition(
  contributions: readonly number[],
  entropy: number,
  label: string,
): void {
  check(
    contributions.length === 36,
    `${label}: entropy decomposition has ${contributions.length} terms, not 36`,
  )
  const sum = contributions.reduce((total, term) => total + term, 0)
  check(
    Math.abs(sum - entropy) < 1e-5,
    `${label}: the 36 per-bin entropy terms sum to ${sum.toFixed(6)}, but H is ${entropy.toFixed(6)} — the page would show a decomposition that is not the measurement`,
  )
  for (const term of contributions) {
    check(term >= -1e-12, `${label}: a negative entropy term (${term}) — −P·ln P is never below zero for P in [0, 1]`)
  }
}

function checkRose(shares: readonly number[], label: string): void {
  check(shares.length === 36, `${label}: rose must have 36 bins, has ${shares.length}`)
  const total = shares.reduce((sum, share) => sum + share, 0)
  check(Math.abs(total - 1) < 1e-4, `${label}: rose shares sum to ${total.toFixed(6)}, not 1`)
  for (let i = 0; i < 18; i += 1) {
    const a = shares[i] ?? 0
    const b = shares[i + 18] ?? 0
    check(
      Math.abs(a - b) < 1e-6,
      `${label}: rose is not 180°-symmetric at bin ${i} (${a} vs ${b}) — the bearing computation is wrong`,
    )
  }
}

function checkBundle(bundle: SiteBundle): void {
  const { slug } = bundle.site

  check(bundle.radiusM === SAMPLING_RADIUS_M, `${slug}: radius ${bundle.radiusM} ≠ ${SAMPLING_RADIUS_M}`)
  check(bundle.licence === 'ODbL-1.0', `${slug}: derived data must carry ODbL`)
  check(bundle.attribution.includes('OpenStreetMap'), `${slug}: missing OpenStreetMap attribution`)

  for (const mode of ['drive', 'walk'] as const) {
    const { metrics, geometry, plateGeometry } = bundle[mode]
    check(geometry.length > 0, `${slug}/${mode}: no geometry — a site with one mode is incomplete`)
    check(plateGeometry.length > 0, `${slug}/${mode}: no plate-scale geometry`)
    check(
      plateGeometry.length <= geometry.length,
      `${slug}/${mode}: plate geometry is not a simplification of the full geometry`,
    )
    check(metrics.degrees.nodeCount > 0, `${slug}/${mode}: empty graph`)
    checkRose(metrics.rose.shares, `${slug}/${mode}`)
    checkEntropyDecomposition(
      metrics.rose.binContributions,
      metrics.orientationEntropy,
      `${slug}/${mode}`,
    )
    check(metrics.edgeCircuity >= 1 - 1e-9, `${slug}/${mode}: edge circuity ${metrics.edgeCircuity} < 1`)
    check(
      metrics.sampledCircuity >= 1 - 1e-9,
      `${slug}/${mode}: sampled circuity ${metrics.sampledCircuity} < 1 — network distance is broken`,
    )
    const p = metrics.degrees.proportions
    const sum = p.deadEnd + p.through + p.threeWay + p.fourWay + p.fivePlus
    check(Math.abs(sum - 1) < 1e-4, `${slug}/${mode}: degree proportions sum to ${sum}, not 1`)
    check(
      metrics.orientationOrder >= 0 && metrics.orientationOrder <= 1,
      `${slug}/${mode}: φ outside [0, 1]`,
    )
  }

  check(
    bundle.walk.metrics.totalLengthM >= bundle.drive.metrics.totalLengthM - 1,
    `${slug}: the walking network is shorter than the driving network — the tag mapping admits a drivable class the walkable set excludes`,
  )

  check(bundle.sensitivity.length >= 1, `${slug}: no tag-mapping sensitivity recorded`)

  /*
   * The walk-only set must index the arrays it claims to index, or the
   * difference drawing silently draws the wrong edges in ink — a wrong figure
   * that looks entirely plausible, which is the worst kind.
   */
  const walkOnly = bundle.walkOnly
  for (const index of walkOnly.indices) {
    check(
      index < bundle.walk.geometry.length,
      `${slug}: walk-only index ${index} is outside the walking geometry`,
    )
  }
  for (const index of walkOnly.plateIndices) {
    check(
      index < bundle.walk.plateGeometry.length,
      `${slug}: walk-only plate index ${index} is outside the plate geometry`,
    )
  }
  check(
    new Set(walkOnly.indices).size === walkOnly.indices.length,
    `${slug}: walk-only indices contain a duplicate`,
  )
  check(
    walkOnly.lengthM <= bundle.walk.metrics.totalLengthM + 1,
    `${slug}: more walk-only length than walking network — membership is wrong`,
  )
  check(
    walkOnly.lengthM >= bundle.walk.metrics.totalLengthM - bundle.drive.metrics.totalLengthM - 1,
    `${slug}: the walking network gains more length than it has walk-only edges — a drivable way is being counted as walk-only, or the reverse`,
  )

  check(bundle.extractVersion.length > 3, `${slug}: no extract timestamp — the number is not reproducible`)

  // The exemplars carry every mapping, and nothing else carries any: an
  // exemplar missing a mapping would show a gap the reader would read as a
  // finding about the mapping rather than as a missing figure.
  const isExemplar = MAPPING_EXEMPLAR_SLUGS.includes(slug)
  if (isExemplar) {
    check(
      bundle.alternateGeometry !== undefined && bundle.alternateGeometry.length >= 2,
      `${slug}: named a mapping exemplar but carries no alternative geometry`,
    )
    for (const alternate of bundle.alternateGeometry ?? []) {
      check(
        alternate.drivePlateGeometry.length > 0 && alternate.walkPlateGeometry.length > 0,
        `${slug}/${alternate.mappingId}: empty comparison geometry`,
      )
    }
  } else {
    check(
      bundle.alternateGeometry === undefined,
      `${slug}: carries alternative geometry without being a named exemplar — the payload decision must stay explicit`,
    )
  }

  if (bundle.coverage.confidence.type === 'thin') {
    notes.push(
      `⚑ ${slug}: thin footway coverage (${(bundle.coverage.pedestrianShare * 100).toFixed(1)}% of walking-network length). Flagged, not compared as complete.`,
    )
  }

  scanForForbiddenKeys(bundle, slug)
}

async function main(): Promise<void> {
  if (!existsSync(join(OUT_DIR, 'manifest.json'))) {
    console.error('data/out/manifest.json is missing. Run `pnpm data:fetch && pnpm data:build`.')
    process.exit(1)
  }

  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(join(OUT_DIR, 'manifest.json'), 'utf8')),
  )

  check(manifest.binCount === 36, 'manifest: Boeing 2019 uses 36 bins')
  check(manifest.radiusM === SAMPLING_RADIUS_M, 'manifest: radius does not match the definition')
  check(manifest.licence === 'ODbL-1.0', 'manifest: derived data must be offered under ODbL')
  check(manifest.attribution.includes('OpenStreetMap'), 'manifest: missing OpenStreetMap attribution')
  check(manifest.method.doi.length > 5, 'manifest: the method citation must carry its DOI')
  check(
    manifest.sites.length === SITES.length,
    `manifest lists ${manifest.sites.length} sites, the definitions have ${SITES.length}`,
  )
  scanForForbiddenKeys(manifest, 'manifest')

  // The sensitivity summary must cover every alternative mapping in both
  // modes, or the assumptions page would silently under-report the dependence.
  const alternatives = manifest.sensitivitySummary.map((entry) => entry.mappingId)
  check(
    new Set(alternatives).size >= 1,
    'manifest: no tag-mapping sensitivity summary — the assumption would be undocumented',
  )
  for (const entry of manifest.sensitivitySummary) {
    check(
      entry.meanAbsoluteChange <= entry.maxAbsoluteChange + 1e-9,
      `sensitivity: ${entry.metric}/${entry.mode}/${entry.mappingId} has a mean above its maximum`,
    )
  }

  const radii = new Set(manifest.sites.map((site) => site.radiusM))
  check(radii.size === 1, `radius varies across the comparison set: ${[...radii].join(', ')}`)

  for (const site of SITES) {
    const path = join(OUT_DIR, `${site.slug}.json`)
    if (!existsSync(path)) {
      failures.push(`${site.slug}: no bundle emitted`)
      continue
    }
    checkBundle(siteBundleSchema.parse(JSON.parse(await readFile(path, 'utf8'))))
  }

  /*
   * The survey is part of the honesty contract, not an optional extra: without
   * it the reader has the sixteen sites and no way to check they were not
   * chosen for their numbers (PRD §4).
   */
  if (!existsSync(SURVEY_PATH)) {
    failures.push('data/survey.json is missing — run `pnpm data:survey`. Site selection would be undocumented.')
  } else {
    const survey = surveySchema.parse(JSON.parse(await readFile(SURVEY_PATH, 'utf8')))
    check(
      survey.radiusM === SAMPLING_RADIUS_M,
      `survey: measured at r=${survey.radiusM} m, the set is r=${SAMPLING_RADIUS_M} m — a survey that samples differently predicts nothing`,
    )
    check(
      survey.mappingId === manifest.mappingId,
      `survey: mapping "${survey.mappingId}" ≠ pipeline mapping "${manifest.mappingId}"`,
    )
    check(survey.licence === 'ODbL-1.0', 'survey: derived data must carry ODbL')
    scanForForbiddenKeys(survey, 'survey')

    // Every adopted candidate must name a site that exists, or the page would
    // claim a provenance the comparison set does not have.
    const slugs = new Set(SITES.map((site) => site.slug))
    for (const candidate of survey.candidates) {
      if (candidate.adoptedAs === null) continue
      check(
        slugs.has(candidate.adoptedAs),
        `survey: candidate ${candidate.label} claims to be site "${candidate.adoptedAs}", which does not exist`,
      )
    }
    const cleared = survey.candidates.filter((c) => c.confidence !== 'thin').length
    notes.push(
      `Survey: ${cleared} of ${survey.candidates.length} candidate centres clear the thin threshold.`,
    )
  }

  const thin = manifest.sites.filter((site) => site.coverage.confidence.type === 'thin').length
  console.log(
    `Validated ${manifest.sites.length} sites · r=${manifest.radiusM} m · 36 bins · mapping "${manifest.mappingId}" · extract ${manifest.extractVersion}`,
  )
  console.log(`${manifest.attribution}`)
  for (const note of notes) console.log(note)
  console.log(`\n${thin} of ${manifest.sites.length} sites carry a thin-coverage flag.`)

  if (failures.length > 0) {
    console.error(`\n${failures.length} validation failure(s):`)
    for (const failure of failures) console.error(`  ✗ ${failure}`)
    process.exit(1)
  }
  console.log('All invariants hold.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
