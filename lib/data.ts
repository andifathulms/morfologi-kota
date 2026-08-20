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
  siteBundleSchema,
  type Manifest,
  type ManifestEntry,
  type SiteBundle,
} from '@/data/sites'

const OUT_DIR = join(process.cwd(), 'data', 'out')

let cachedManifest: Manifest | undefined

export function loadManifest(): Manifest {
  if (cachedManifest === undefined) {
    cachedManifest = manifestSchema.parse(
      JSON.parse(readFileSync(join(OUT_DIR, 'manifest.json'), 'utf8')),
    )
  }
  return cachedManifest
}

export function loadBundle(slug: string): SiteBundle {
  return siteBundleSchema.parse(
    JSON.parse(readFileSync(join(OUT_DIR, `${slug}.json`), 'utf8')),
  )
}

export function manifestEntry(slug: string): ManifestEntry | undefined {
  return loadManifest().sites.find((site) => site.slug === slug)
}
