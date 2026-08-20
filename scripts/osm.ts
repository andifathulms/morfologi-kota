/**
 * The OSM extract: shared types and the cache on disk.
 *
 * BUILD TIME ONLY. Nothing in `app/` or `components/` may import this, and
 * neither Overpass nor Geofabrik is ever called at runtime — Overpass is a
 * volunteer-funded service whose operators note it is optimised for
 * flexibility rather than performance, and querying it from a deployed page
 * would be both slow and discourteous (PRD §7).
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const CACHE_DIR = join(process.cwd(), 'data', 'cache')

export interface RawNode {
  readonly type: 'node'
  readonly id: number
  readonly lat: number
  readonly lon: number
  readonly tags?: Record<string, string>
}

export interface RawWay {
  readonly type: 'way'
  readonly id: number
  readonly nodes: number[]
  readonly tags?: Record<string, string>
}

export type RawElement = RawNode | RawWay | { readonly type: string; readonly id: number }

export interface OverpassResponse {
  readonly version?: number
  readonly osm3s?: { readonly timestamp_osm_base?: string; readonly copyright?: string }
  readonly elements: RawElement[]
}

export interface CachedExtract {
  readonly slug: string
  /** The Overpass query verbatim, so the extract can be reproduced. */
  readonly query: string
  /** The database timestamp Overpass reports — this is the extract version. */
  readonly timestampOsmBase: string
  readonly response: OverpassResponse
}

export function cachePathFor(slug: string): string {
  return join(CACHE_DIR, `${slug}.json`)
}

export function hasCachedExtract(slug: string): boolean {
  return existsSync(cachePathFor(slug))
}

export async function readCachedExtract(slug: string): Promise<CachedExtract> {
  const path = cachePathFor(slug)
  if (!existsSync(path)) {
    throw new Error(
      `no cached extract for "${slug}". Run \`pnpm data:fetch\` first — the pipeline is build-time only and never fetches during a page render.`,
    )
  }
  return JSON.parse(await readFile(path, 'utf8')) as CachedExtract
}

export async function writeCachedExtract(extract: CachedExtract): Promise<void> {
  const path = cachePathFor(extract.slug)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(extract), 'utf8')
}

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'

/**
 * One Overpass request, with backoff.
 *
 * Sequential and spaced by every caller: Overpass is volunteer-funded and its
 * operators ask that it not be hammered. Every response is cached, so a second
 * run of the pipeline touches the service not at all.
 */
export async function fetchOverpass(query: string, attempts = 3): Promise<OverpassResponse> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'morfologi-kota/0.1 (build-time site extract; contact via repository)',
        },
        body: new URLSearchParams({ data: query }).toString(),
      })
      if (!response.ok) throw new Error(`Overpass responded ${response.status}`)
      return (await response.json()) as OverpassResponse
    } catch (error) {
      lastError = error
      const backoff = 3000 * 2 ** attempt
      console.warn(`   attempt ${attempt} failed (${String(error)}); waiting ${backoff}ms`)
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/** The extract query for one disc. Shared so a survey samples what a site will. */
export function extractQuery(latDeg: number, lonDeg: number, radiusM: number): string {
  return `[out:json][timeout:180];
way(around:${Math.round(radiusM)},${latDeg},${lonDeg})["highway"];
(._;>;);
out body qt;`
}

/** Split a cached Overpass response into the node index and way list. */
export function splitElements(response: OverpassResponse): {
  nodes: Map<number, { lonDeg: number; latDeg: number }>
  ways: { id: number; tags: Record<string, string>; nodes: number[] }[]
} {
  const nodes = new Map<number, { lonDeg: number; latDeg: number }>()
  const ways: { id: number; tags: Record<string, string>; nodes: number[] }[] = []
  for (const element of response.elements) {
    if (element.type === 'node') {
      const node = element as RawNode
      nodes.set(node.id, { lonDeg: node.lon, latDeg: node.lat })
    } else if (element.type === 'way') {
      const way = element as RawWay
      ways.push({ id: way.id, tags: way.tags ?? {}, nodes: way.nodes ?? [] })
    }
  }
  // Sorted so the emitted bundle does not depend on Overpass's element order.
  ways.sort((a, b) => a.id - b.id)
  return { nodes, ways }
}
