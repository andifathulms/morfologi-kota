/**
 * DEV/CI — pull the OSM extract for every site.
 *
 * BUILD TIME ONLY (PRD §7). The result is cached under `data/cache/`, which is
 * git-ignored: raw extracts are never committed, only the simplified geometry
 * and the metrics the pipeline derives from them (CLAUDE.md, Invariants §14).
 *
 * Deviation from the original plan, recorded deliberately: the sites are
 * fetched as per-site Overpass extracts rather than by clipping the Geofabrik
 * Indonesia PBF. Twelve discs of a kilometre or so are a few megabytes against
 * the best part of a gigabyte, and reading PBF would mean a protobuf and an
 * OSM-format dependency for data this project uses once. The binding
 * constraint — that neither service is touched at runtime — is unchanged.
 * Requests are sequential and spaced, and a cached site is never re-fetched.
 *
 *   pnpm data:fetch              # fetch what is missing
 *   pnpm data:fetch -- --force   # re-fetch everything
 */

import { SITES, SAMPLING_RADIUS_M } from '@/data/sites'
import { hasCachedExtract, writeCachedExtract, type OverpassResponse } from './osm'

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'

/**
 * Fetched with a margin beyond the sampling radius so that ways crossing the
 * boundary arrive whole and the clip has something to truncate.
 */
const FETCH_MARGIN = 1.4
const PAUSE_MS = 3000

function queryFor(latDeg: number, lonDeg: number): string {
  const radius = Math.round(SAMPLING_RADIUS_M * FETCH_MARGIN)
  return `[out:json][timeout:180];
way(around:${radius},${latDeg},${lonDeg})["highway"];
(._;>;);
out body qt;`
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(query: string, attempts = 3): Promise<OverpassResponse> {
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
      const backoff = PAUSE_MS * 2 ** attempt
      console.warn(`   attempt ${attempt} failed (${String(error)}); waiting ${backoff}ms`)
      await sleep(backoff)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function main(): Promise<void> {
  const force = process.argv.includes('--force')
  console.log(`Fetching ${SITES.length} site extracts at r=${SAMPLING_RADIUS_M} m (+40% margin).`)
  console.log('Data © OpenStreetMap contributors, ODbL 1.0.\n')

  let fetched = 0
  for (const site of SITES) {
    if (!force && hasCachedExtract(site.slug)) {
      console.log(`·  ${site.slug} — cached`)
      continue
    }
    const query = queryFor(site.centreLatDeg, site.centreLonDeg)
    process.stdout.write(`↓  ${site.slug} … `)
    const response = await fetchWithRetry(query)
    const timestampOsmBase = response.osm3s?.timestamp_osm_base ?? 'unknown'
    await writeCachedExtract({ slug: site.slug, query, timestampOsmBase, response })
    console.log(`${response.elements.length} elements, base ${timestampOsmBase}`)
    fetched += 1
    if (fetched > 0) await sleep(PAUSE_MS)
  }

  console.log(`\nDone. ${fetched} fetched, ${SITES.length - fetched} already cached.`)
  console.log('Next: pnpm data:build')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
