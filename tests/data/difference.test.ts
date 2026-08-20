/**
 * The walk-only set, the survey, and the per-site provenance.
 *
 * These are the three things added on top of the pair, and each of them makes
 * a claim a reader is invited to trust: that the ink in the difference drawing
 * is the edges the driving network lacks, that the sixteen sites were selected
 * on coverage rather than on their numbers, and that a single number can be
 * traced back to a single extract.
 *
 * Every check here is against the emitted files, so a change to
 * `lib/morphology`, `lib/tags` or the pipeline that would break one of those
 * claims fails at `pnpm test:run` rather than on the deployed page.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MAPPING_EXEMPLAR_SLUGS,
  SAMPLING_RADIUS_M,
  SITES,
  manifestSchema,
  siteBundleSchema,
  surveySchema,
} from '@/data/sites'
import { THIN_COVERAGE_THRESHOLD } from '@/lib/morphology'
import { DEFAULT_TAG_MAPPING, TAG_MAPPINGS, admitsWay } from '@/lib/tags'

const OUT = join(process.cwd(), 'data', 'out')
const manifest = manifestSchema.parse(JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8')))
const bundles = SITES.map((site) =>
  siteBundleSchema.parse(JSON.parse(readFileSync(join(OUT, `${site.slug}.json`), 'utf8'))),
)
const survey = surveySchema.parse(
  JSON.parse(readFileSync(join(process.cwd(), 'data', 'survey.json'), 'utf8')),
)

describe('the walk-only set', () => {
  it.each(bundles.map((bundle) => [bundle.site.slug, bundle] as const))(
    '%s: indexes only edges that exist',
    (_slug, bundle) => {
      for (const index of bundle.walkOnly.indices) {
        expect(bundle.walk.geometry[index]).toBeDefined()
      }
      for (const index of bundle.walkOnly.plateIndices) {
        expect(bundle.walk.plateGeometry[index]).toBeDefined()
      }
    },
  )

  it.each(bundles.map((bundle) => [bundle.site.slug, bundle] as const))(
    '%s: never indexes the same edge twice',
    (_slug, bundle) => {
      expect(new Set(bundle.walkOnly.indices).size).toBe(bundle.walkOnly.indices.length)
      expect(new Set(bundle.walkOnly.plateIndices).size).toBe(bundle.walkOnly.plateIndices.length)
    },
  )

  /*
   * The bound that makes the drawing honest.
   *
   * Walk-only length can exceed the raw walk-minus-drive difference — the
   * walking network can lose a motorway while gaining a hundred gang — but it
   * can never be less, because every metre the walking network has over the
   * driving one has to sit on an edge the driving network does not admit.
   */
  it.each(bundles.map((bundle) => [bundle.site.slug, bundle] as const))(
    '%s: accounts for at least the length walking gains',
    (_slug, bundle) => {
      const gained = bundle.walk.metrics.totalLengthM - bundle.drive.metrics.totalLengthM
      expect(bundle.walkOnly.lengthM).toBeGreaterThanOrEqual(gained - 1)
      expect(bundle.walkOnly.lengthM).toBeLessThanOrEqual(bundle.walk.metrics.totalLengthM + 1)
    },
  )

  it.each(bundles.map((bundle) => [bundle.site.slug, bundle] as const))(
    '%s: its share matches its length',
    (_slug, bundle) => {
      const expected = bundle.walkOnly.lengthM / bundle.walk.metrics.totalLengthM
      expect(bundle.walkOnly.shareOfWalk).toBeCloseTo(expected, 4)
    },
  )

  /*
   * Membership is a tag decision, not a geometric one. This asserts the rule
   * itself rather than the emitted numbers: nothing the driving tag set admits
   * may ever be called walk-only, whatever the pipeline computed.
   */
  it('never calls a drive-admitted class walk-only', () => {
    for (const highway of ['residential', 'primary', 'secondary', 'tertiary', 'unclassified']) {
      const way = { id: 1, tags: { highway }, nodes: [] }
      expect(admitsWay(way, DEFAULT_TAG_MAPPING, 'drive')).toBe(true)
    }
    for (const highway of ['footway', 'path', 'steps', 'pedestrian']) {
      const way = { id: 1, tags: { highway }, nodes: [] }
      expect(admitsWay(way, DEFAULT_TAG_MAPPING, 'drive')).toBe(false)
    }
  })

  it('carries the same length in the manifest as in the bundle', () => {
    for (const bundle of bundles) {
      const entry = manifest.sites.find((site) => site.slug === bundle.site.slug)
      expect(entry?.walkOnly.lengthM).toBe(bundle.walkOnly.lengthM)
      expect(entry?.walkOnly.shareOfWalk).toBe(bundle.walkOnly.shareOfWalk)
    }
  })

  /*
   * A site with no pedestrian-only mapping at all must report no walk-only
   * length. Presently IKN, whose walking network is exactly its driving
   * network — which is a real datum about the extract, not a bug.
   */
  it('reports nothing where nothing is mapped', () => {
    for (const bundle of bundles) {
      if (bundle.coverage.pedestrianLengthM > 0) continue
      expect(bundle.walkOnly.lengthM).toBe(0)
      expect(bundle.walkOnly.indices).toHaveLength(0)
    }
  })
})

describe('per-site provenance', () => {
  it('gives every site its own extract timestamp', () => {
    for (const bundle of bundles) {
      expect(bundle.extractVersion.length).toBeGreaterThan(3)
      const entry = manifest.sites.find((site) => site.slug === bundle.site.slug)
      expect(entry?.extractVersion).toBe(bundle.extractVersion)
    }
  })

  it("names every site's extract in the manifest's joined version", () => {
    for (const bundle of bundles) {
      expect(manifest.extractVersion).toContain(bundle.extractVersion)
    }
  })
})

describe('the mapping exemplars', () => {
  it('carry every mapping, and only the named sites do', () => {
    for (const bundle of bundles) {
      const named = MAPPING_EXEMPLAR_SLUGS.includes(bundle.site.slug)
      if (!named) {
        expect(bundle.alternateGeometry).toBeUndefined()
        continue
      }
      const ids = (bundle.alternateGeometry ?? []).map((entry) => entry.mappingId).sort()
      expect(ids).toEqual(TAG_MAPPINGS.map((mapping) => mapping.id).sort())
    }
  })

  it('draw something under every mapping', () => {
    for (const slug of MAPPING_EXEMPLAR_SLUGS) {
      const bundle = bundles.find((candidate) => candidate.site.slug === slug)
      for (const alternate of bundle?.alternateGeometry ?? []) {
        expect(alternate.drivePlateGeometry.length).toBeGreaterThan(0)
        expect(alternate.walkPlateGeometry.length).toBeGreaterThan(0)
      }
    }
  })

  /*
   * The walking network admits everything the driving network does and more,
   * under every mapping — so the comparison discs must never show a walking
   * network shorter than its driving one. This is the same invariant the
   * validator asserts for the default mapping, extended to the alternatives.
   */
  it('never draw a walking network shorter than its driving network', () => {
    for (const slug of MAPPING_EXEMPLAR_SLUGS) {
      const bundle = bundles.find((candidate) => candidate.site.slug === slug)
      for (const alternate of bundle?.alternateGeometry ?? []) {
        expect(alternate.walkTotalLengthM).toBeGreaterThanOrEqual(alternate.driveTotalLengthM - 1)
      }
    }
  })
})

describe('the candidate survey', () => {
  it('samples exactly as the pipeline does, or it predicts nothing', () => {
    expect(survey.radiusM).toBe(SAMPLING_RADIUS_M)
    expect(survey.mappingId).toBe(manifest.mappingId)
    expect(survey.thinThreshold).toBe(THIN_COVERAGE_THRESHOLD)
  })

  it('classifies every candidate against the same threshold the sites use', () => {
    for (const candidate of survey.candidates) {
      const thin = candidate.pedestrianShare < survey.thinThreshold
      expect(candidate.confidence === 'thin').toBe(thin)
    }
  })

  it('only claims adoption for sites that exist', () => {
    const slugs = new Set(SITES.map((site) => site.slug))
    for (const candidate of survey.candidates) {
      if (candidate.adoptedAs === null) continue
      expect(slugs.has(candidate.adoptedAs)).toBe(true)
    }
  })

  it('carries ODbL, like every other derived table', () => {
    expect(survey.licence).toBe('ODbL-1.0')
    expect(survey.attribution).toContain('OpenStreetMap')
  })

  /*
   * The claim the method page makes in prose. If a perumahan candidate ever
   * clears the threshold this fails, and the page's sentence has to change —
   * which is the point: the number is not written down anywhere it could rot
   * quietly, and the test says so out loud when it moves.
   */
  it('records that no perumahan candidate has yet cleared the threshold', () => {
    const perumahan = survey.candidates.filter((candidate) => candidate.type === 'perumahan')
    expect(perumahan.length).toBeGreaterThan(0)
    for (const candidate of perumahan) {
      expect(candidate.confidence).toBe('thin')
    }
  })
})
