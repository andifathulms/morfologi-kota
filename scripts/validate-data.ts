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
  SAMPLING_RADIUS_M,
  SITES,
  manifestSchema,
  siteBundleSchema,
  type SiteBundle,
} from '@/data/sites'

const OUT_DIR = join(process.cwd(), 'data', 'out')

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
    const { metrics, geometry } = bundle[mode]
    check(geometry.length > 0, `${slug}/${mode}: no geometry — a site with one mode is incomplete`)
    check(metrics.degrees.nodeCount > 0, `${slug}/${mode}: empty graph`)
    checkRose(metrics.rose.shares, `${slug}/${mode}`)
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
