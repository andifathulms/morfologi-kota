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
import { extractQuery, fetchOverpass, hasCachedExtract, pause, writeCachedExtract } from './osm'

/**
 * Fetched with a margin beyond the sampling radius so that ways crossing the
 * boundary arrive whole and the clip has something to truncate.
 */
const FETCH_MARGIN = 1.4
const PAUSE_MS = 3000

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
    const query = extractQuery(
      site.centreLatDeg,
      site.centreLonDeg,
      SAMPLING_RADIUS_M * FETCH_MARGIN,
    )
    process.stdout.write(`↓  ${site.slug} … `)
    const response = await fetchOverpass(query)
    const timestampOsmBase = response.osm3s?.timestamp_osm_base ?? 'unknown'
    await writeCachedExtract({ slug: site.slug, query, timestampOsmBase, response })
    console.log(`${response.elements.length} elements, base ${timestampOsmBase}`)
    fetched += 1
    if (fetched > 0) await pause(PAUSE_MS)
  }

  console.log(`\nDone. ${fetched} fetched, ${SITES.length - fetched} already cached.`)
  console.log('Next: pnpm data:build')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
