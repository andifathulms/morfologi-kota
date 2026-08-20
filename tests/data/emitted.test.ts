/**
 * The shipped bundles, checked as tests rather than only as a build gate.
 *
 * `pnpm data:validate` runs the same invariants and blocks the deploy; these
 * run in the ordinary suite, so a change to `lib/morphology` that would move
 * the shipped numbers out of range fails at `pnpm test:run` rather than at
 * deploy time.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SAMPLING_RADIUS_M, SITES, manifestSchema, siteBundleSchema } from '@/data/sites'
import { TAG_MAPPINGS } from '@/lib/tags'

const OUT = join(process.cwd(), 'data', 'out')
const manifest = manifestSchema.parse(JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8')))
const bundles = SITES.map((site) =>
  siteBundleSchema.parse(JSON.parse(readFileSync(join(OUT, `${site.slug}.json`), 'utf8'))),
)

describe('the manifest', () => {
  it('covers every defined site', () => {
    expect(manifest.sites.map((site) => site.slug).sort()).toEqual(
      SITES.map((site) => site.slug).sort(),
    )
  })

  it('uses one radius across the comparison set', () => {
    const radii = new Set(manifest.sites.map((site) => site.radiusM))
    expect([...radii]).toEqual([SAMPLING_RADIUS_M])
  })

  it('carries the citation, the DOI and the ODbL terms', () => {
    expect(manifest.method.citation).toContain('Boeing')
    expect(manifest.method.doi).toBe('10.1007/s41109-019-0189-1')
    expect(manifest.licence).toBe('ODbL-1.0')
    expect(manifest.attribution).toContain('OpenStreetMap')
  })

  it('bins into 36, as Boeing 2019 does', () => {
    expect(manifest.binCount).toBe(36)
  })
})

describe.each(bundles.map((bundle) => [bundle.site.slug, bundle] as const))('%s', (_slug, bundle) => {
  it('computes both modes — a site with one mode is incomplete', () => {
    expect(bundle.drive.metrics.degrees.nodeCount).toBeGreaterThan(0)
    expect(bundle.walk.metrics.degrees.nodeCount).toBeGreaterThan(0)
    expect(bundle.drive.geometry.length).toBeGreaterThan(0)
    expect(bundle.walk.geometry.length).toBeGreaterThan(0)
  })

  it('has a 180°-symmetric rose in both modes', () => {
    for (const mode of ['drive', 'walk'] as const) {
      const shares = bundle[mode].metrics.rose.shares
      for (let i = 0; i < 18; i += 1) {
        expect(shares[i]).toBeCloseTo(shares[i + 18]!, 5)
      }
    }
  })

  it('has circuity of at least one in both modes', () => {
    for (const mode of ['drive', 'walk'] as const) {
      expect(bundle[mode].metrics.sampledCircuity).toBeGreaterThanOrEqual(1)
      expect(bundle[mode].metrics.edgeCircuity).toBeGreaterThanOrEqual(1)
    }
  })

  it('has degree proportions summing to one', () => {
    for (const mode of ['drive', 'walk'] as const) {
      const p = bundle[mode].metrics.degrees.proportions
      expect(p.deadEnd + p.through + p.threeWay + p.fourWay + p.fivePlus).toBeCloseTo(1, 4)
    }
  })

  it('has a walking network at least as long as its driving network', () => {
    expect(bundle.walk.metrics.totalLengthM).toBeGreaterThanOrEqual(
      bundle.drive.metrics.totalLengthM - 1,
    )
  })

  it('reports coverage confidence and the radius it was sampled at', () => {
    expect(bundle.radiusM).toBe(SAMPLING_RADIUS_M)
    expect(['thin', 'moderate', 'good']).toContain(bundle.coverage.confidence.type)
  })

  it('records the sensitivity of its numbers to every tag mapping', () => {
    expect(bundle.sensitivity.map((entry) => entry.mappingId).sort()).toEqual(
      TAG_MAPPINGS.map((mapping) => mapping.id).sort(),
    )
  })

  it('carries ODbL and its attribution', () => {
    expect(bundle.licence).toBe('ODbL-1.0')
    expect(bundle.attribution).toContain('OpenStreetMap')
  })

  it('has a plate geometry that is a simplification, not a different drawing', () => {
    expect(bundle.drive.plateGeometry.length).toBeLessThanOrEqual(bundle.drive.geometry.length)
    expect(bundle.walk.plateGeometry.length).toBeLessThanOrEqual(bundle.walk.geometry.length)
  })
})

describe('the data carries no ranking', () => {
  const forbidden = /"(score|grade|rank|ranking|rating|index|liveability|walkability)"\s*:/i

  it('has no score, grade, rank or index key anywhere', () => {
    for (const site of SITES) {
      const raw = readFileSync(join(OUT, `${site.slug}.json`), 'utf8')
      expect(forbidden.test(raw)).toBe(false)
    }
    expect(forbidden.test(readFileSync(join(OUT, 'manifest.json'), 'utf8'))).toBe(false)
  })
})
