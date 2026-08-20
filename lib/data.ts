/**
 * Reading the emitted bundles.
 *
 * Server-side only: these are imported by server components at build time, so
 * the geometry is rendered into static SVG and never ships as JavaScript. The
 * page makes no network request at runtime because there is nothing left to
 * fetch (PRD §10 — zero network requests after first load).
 *
 * Nothing here computes a metric. Everything was computed by the pipeline
 * (CLAUDE.md, Invariants §16).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  manifestSchema,
  referenceSchema,
  siteBundleSchema,
  surveySchema,
  type Manifest,
  type ManifestEntry,
  type Reference,
  type SiteBundle,
  type Survey,
} from '@/data/sites'

const OUT_DIR = join(process.cwd(), 'data', 'out')

/*
 * The survey sits beside `data/out` rather than inside it, because `data:build`
 * wipes that directory and the survey is not built from the same inputs — it
 * measures candidate centres, most of which are deliberately not sites.
 */
const SURVEY_PATH = join(process.cwd(), 'data', 'survey.json')

let cachedManifest: Manifest | undefined
let cachedSurvey: Survey | undefined
let cachedReference: Reference | undefined

export function loadManifest(): Manifest {
  if (cachedManifest === undefined) {
    cachedManifest = manifestSchema.parse(
      JSON.parse(readFileSync(join(OUT_DIR, 'manifest.json'), 'utf8')),
    )
  }
  return cachedManifest
}

/** The candidate survey — how the comparison set was selected (PRD §4). */
export function loadSurvey(): Survey {
  if (cachedSurvey === undefined) {
    cachedSurvey = surveySchema.parse(JSON.parse(readFileSync(SURVEY_PATH, 'utf8')))
  }
  return cachedSurvey
}

/** The known-answer networks — the scale every real number is read against. */
export function loadReference(): Reference {
  if (cachedReference === undefined) {
    cachedReference = referenceSchema.parse(
      JSON.parse(readFileSync(join(OUT_DIR, 'reference.json'), 'utf8')),
    )
  }
  return cachedReference
}

export function loadBundle(slug: string): SiteBundle {
  return siteBundleSchema.parse(
    JSON.parse(readFileSync(join(OUT_DIR, `${slug}.json`), 'utf8')),
  )
}

export function manifestEntry(slug: string): ManifestEntry | undefined {
  return loadManifest().sites.find((site) => site.slug === slug)
}
