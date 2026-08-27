/**
 * DEV — find candidate centres by measuring, instead of by guessing.
 *
 * The survey answers "is this centre well mapped". It cannot answer "where
 * are the well-mapped places", and until now that question was answered by a
 * hand-written list of neighbourhoods somebody thought sounded promising. Two
 * rounds of that produced 49 candidates and 10 usable sites, which is a poor
 * yield and — worse — a yield whose misses say nothing. A neighbourhood that
 * was never guessed is not a neighbourhood that was measured and rejected.
 *
 * So this asks OpenStreetMap directly. For each city it fetches every
 * pedestrian way and every street in a box around the centre, bins them into
 * an 800 m grid — the sampling radius, so a cell is roughly the disc a site
 * would occupy — and ranks cells by how much pedestrian network they contain.
 *
 * **It selects on data completeness, exactly like the survey, and never on the
 * metrics.** Nothing here reads a bearing, an entropy or a dead-end ratio.
 * Density of mapped footway is a property of the map, not of the place, and
 * that is the whole point: it says where a comparison is *possible*.
 *
 * Two guards encode what the last round taught, and both are reported rather
 * than applied silently:
 *
 * - **Parks.** Bogor Suryakencana came back the best-covered candidate in the
 *   survey because a third of its footway length was the botanical garden.
 *   A cell containing a mapped park is flagged, because coverage cannot tell a
 *   garden path from a gang and neither can this.
 * - **Paths.** Ubud clears its threshold on rice-field and ridge `path`.
 *   That is a real walking network and it was adopted, but it is not a gang,
 *   so each cell reports what share of its pedestrian ways are `path` rather
 *   than `footway`.
 *
 * Cells are named from OSM's own `place` nodes, so a candidate arrives with
 * the name the map gives it rather than one invented here.
 *
 *   pnpm data:discover
 */

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SAMPLING_RADIUS_M, SITES } from '@/data/sites'
import {
  fetchOverpass,
  hasCachedExtract,
  pause,
  readCachedExtract,
  writeCachedExtract,
  type OverpassResponse,
} from './osm'

interface City {
  readonly key: string
  readonly name: string
  readonly latDeg: number
  readonly lonDeg: number
}

/**
 * Where to look. Every province-scale urban centre the set does not already
 * cover, plus the cities it does — a city with one site may well have a better
 * mapped quarter a kilometre away, and only a search can say so.
 */
const CITIES: readonly City[] = [
  { key: 'jakarta', name: 'Jakarta', latDeg: -6.2, lonDeg: 106.82 },
  { key: 'bandung', name: 'Bandung', latDeg: -6.9147, lonDeg: 107.6098 },
  { key: 'bogor', name: 'Bogor', latDeg: -6.595, lonDeg: 106.79 },
  { key: 'semarang', name: 'Semarang', latDeg: -6.9667, lonDeg: 110.4167 },
  { key: 'surabaya', name: 'Surabaya', latDeg: -7.2575, lonDeg: 112.7521 },
  { key: 'yogyakarta', name: 'Yogyakarta', latDeg: -7.7956, lonDeg: 110.3695 },
  { key: 'surakarta', name: 'Surakarta', latDeg: -7.5755, lonDeg: 110.8243 },
  { key: 'malang', name: 'Malang', latDeg: -7.9666, lonDeg: 112.6326 },
  { key: 'cirebon', name: 'Cirebon', latDeg: -6.732, lonDeg: 108.5523 },
  { key: 'denpasar', name: 'Denpasar', latDeg: -8.65, lonDeg: 115.2167 },
  { key: 'ubud', name: 'Ubud', latDeg: -8.5069, lonDeg: 115.2625 },
  { key: 'mataram', name: 'Mataram', latDeg: -8.5833, lonDeg: 116.1167 },
  { key: 'makassar', name: 'Makassar', latDeg: -5.1477, lonDeg: 119.4327 },
  { key: 'manado', name: 'Manado', latDeg: 1.4748, lonDeg: 124.8421 },
  { key: 'palembang', name: 'Palembang', latDeg: -2.9761, lonDeg: 104.7754 },
  { key: 'medan', name: 'Medan', latDeg: 3.5952, lonDeg: 98.6722 },
  { key: 'padang', name: 'Padang', latDeg: -0.9471, lonDeg: 100.4172 },
  { key: 'bukittinggi', name: 'Bukittinggi', latDeg: -0.3055, lonDeg: 100.3691 },
  { key: 'banda-aceh', name: 'Banda Aceh', latDeg: 5.5483, lonDeg: 95.3238 },
  { key: 'banjarmasin', name: 'Banjarmasin', latDeg: -3.3186, lonDeg: 114.5906 },
  { key: 'pontianak', name: 'Pontianak', latDeg: -0.0263, lonDeg: 109.3425 },
  { key: 'balikpapan', name: 'Balikpapan', latDeg: -1.2379, lonDeg: 116.8529 },
  { key: 'samarinda', name: 'Samarinda', latDeg: -0.5022, lonDeg: 117.1536 },
  { key: 'ambon', name: 'Ambon', latDeg: -3.6954, lonDeg: 128.1814 },
  { key: 'jayapura', name: 'Jayapura', latDeg: -2.5333, lonDeg: 140.7181 },
  { key: 'kupang', name: 'Kupang', latDeg: -10.1772, lonDeg: 123.607 },

  /*
   * The second sweep: thirty cities the search had never looked at.
   *
   * Provincial capitals first, because a province with no disc in the set is
   * a hole in a page that claims to be about Indonesian urban form — then the
   * mid-sized Java cities, which are where most Indonesians actually live and
   * which the set had skipped entirely in favour of the metropolitan corridor
   * and a handful of famous kampung.
   */
  { key: 'bekasi', name: 'Bekasi', latDeg: -6.2383, lonDeg: 106.9756 },
  { key: 'depok', name: 'Depok', latDeg: -6.4025, lonDeg: 106.7942 },
  { key: 'tangerang', name: 'Tangerang', latDeg: -6.1783, lonDeg: 106.6319 },
  { key: 'serang', name: 'Serang', latDeg: -6.115, lonDeg: 106.1503 },
  { key: 'tasikmalaya', name: 'Tasikmalaya', latDeg: -7.3274, lonDeg: 108.2207 },
  { key: 'purwokerto', name: 'Purwokerto', latDeg: -7.4249, lonDeg: 109.2397 },
  { key: 'tegal', name: 'Tegal', latDeg: -6.8694, lonDeg: 109.1402 },
  { key: 'pekalongan', name: 'Pekalongan', latDeg: -6.8886, lonDeg: 109.6753 },
  { key: 'magelang', name: 'Magelang', latDeg: -7.4706, lonDeg: 110.2178 },
  { key: 'salatiga', name: 'Salatiga', latDeg: -7.3305, lonDeg: 110.5084 },
  { key: 'kudus', name: 'Kudus', latDeg: -6.8048, lonDeg: 110.8405 },
  { key: 'kediri', name: 'Kediri', latDeg: -7.848, lonDeg: 112.0178 },
  { key: 'madiun', name: 'Madiun', latDeg: -7.6298, lonDeg: 111.5239 },
  { key: 'jember', name: 'Jember', latDeg: -8.1689, lonDeg: 113.7022 },
  { key: 'banyuwangi', name: 'Banyuwangi', latDeg: -8.2192, lonDeg: 114.3691 },
  { key: 'bandar-lampung', name: 'Bandar Lampung', latDeg: -5.4292, lonDeg: 105.261 },
  { key: 'pekanbaru', name: 'Pekanbaru', latDeg: 0.5071, lonDeg: 101.4478 },
  { key: 'jambi', name: 'Jambi', latDeg: -1.6101, lonDeg: 103.6131 },
  { key: 'bengkulu', name: 'Bengkulu', latDeg: -3.7928, lonDeg: 102.2608 },
  { key: 'tanjungpinang', name: 'Tanjungpinang', latDeg: 0.9186, lonDeg: 104.4585 },
  { key: 'palangkaraya', name: 'Palangka Raya', latDeg: -2.21, lonDeg: 113.92 },
  { key: 'singkawang', name: 'Singkawang', latDeg: 0.906, lonDeg: 108.985 },
  { key: 'palu', name: 'Palu', latDeg: -0.8917, lonDeg: 119.8707 },
  { key: 'kendari', name: 'Kendari', latDeg: -3.945, lonDeg: 122.499 },
  { key: 'gorontalo', name: 'Gorontalo', latDeg: 0.5435, lonDeg: 123.0568 },
  { key: 'parepare', name: 'Parepare', latDeg: -4.0135, lonDeg: 119.6255 },
  { key: 'ternate', name: 'Ternate', latDeg: 0.79, lonDeg: 127.38 },
  { key: 'sorong', name: 'Sorong', latDeg: -0.8762, lonDeg: 131.2558 },
  { key: 'singaraja', name: 'Singaraja', latDeg: -8.112, lonDeg: 115.0882 },
  { key: 'ende', name: 'Ende', latDeg: -8.8432, lonDeg: 121.6626 },
]

/** Half the side of the search box, in degrees of latitude — about 11 km. */
const BOX_DEG = 0.05
const CELL_M = SAMPLING_RADIUS_M
const PAUSE_MS = 8000

/** Two discs this close together are the same place sampled twice. */
const MIN_SEPARATION_M = 1600

/**
 * The least mapped pedestrian network worth an Overpass request, per cell.
 *
 * Calibrated against the set rather than chosen: a cell is 0.64 km² and a
 * sampling disc is 2.01 km², so a site carrying eight kilometres of gang
 * across its disc averages about two and a half in a cell. This sits below
 * that on purpose — the survey is the measurement and this only decides what
 * is worth measuring, so it should let through more than it keeps.
 */
const MIN_PEDESTRIAN_M = 1500

const PEDESTRIAN = new Set(['footway', 'path', 'steps', 'pedestrian'])
const STREET = new Set([
  'residential',
  'living_street',
  'service',
  'unclassified',
  'tertiary',
  'tertiary_link',
  'secondary',
  'secondary_link',
  'primary',
  'primary_link',
])

const PLACE_RANK: Readonly<Record<string, number>> = {
  neighbourhood: 0,
  quarter: 1,
  suburb: 2,
  village: 3,
  town: 4,
  city: 5,
}

/**
 * Pedestrian ways come back with geometry, everything else with a centre.
 *
 * The first version of this ranked cells by how many pedestrian ways they
 * contained, which is the wrong measure and was caught by its own output:
 * Bukittinggi is in the comparison set at 21.2% coverage and scored zero,
 * because its footway network is a few long ways rather than many short ones.
 * The pipeline weights by length everywhere — Boeing 2019 §3 — and so does
 * this now.
 *
 * Only the pedestrian set carries geometry. Streets are a count, because all
 * they have to answer is whether there is urban fabric here at all, and
 * fetching their shape would multiply the response for a yes/no.
 */
function query(city: City): string {
  const s = (city.latDeg - BOX_DEG).toFixed(4)
  const w = (city.lonDeg - BOX_DEG).toFixed(4)
  const n = (city.latDeg + BOX_DEG).toFixed(4)
  const e = (city.lonDeg + BOX_DEG).toFixed(4)
  const box = `${s},${w},${n},${e}`
  return `[out:json][timeout:240];
way["highway"~"^(footway|path|steps|pedestrian)$"](${box});
out geom qt;
way["highway"~"^(residential|living_street|service|unclassified|tertiary|tertiary_link|secondary|secondary_link|primary|primary_link)$"](${box});
out center tags qt;
way["leisure"="park"](${box});
out center tags qt;
node["place"~"^(city|town|suburb|village|neighbourhood|quarter)$"](${box});
out qt;`
}

const R = 6_371_000
const rad = (deg: number): number => (deg * Math.PI) / 180

function metresBetween(
  a: { latDeg: number; lonDeg: number },
  b: { latDeg: number; lonDeg: number },
): number {
  const x = rad(b.lonDeg - a.lonDeg) * Math.cos(rad((a.latDeg + b.latDeg) / 2))
  const y = rad(b.latDeg - a.latDeg)
  return Math.hypot(x, y) * R
}

interface Cell {
  readonly city: City
  latDeg: number
  lonDeg: number
  /** Metres of mapped pedestrian way whose midpoints fall in this cell. */
  pedestrian: number
  path: number
  street: number
  park: boolean
  weightLat: number
  weightLon: number
}

interface Place {
  readonly name: string
  readonly rank: number
  readonly latDeg: number
  readonly lonDeg: number
}

function centreOf(element: Record<string, unknown>): { latDeg: number; lonDeg: number } | undefined {
  const centre = element['center'] as { lat: number; lon: number } | undefined
  if (centre !== undefined) return { latDeg: centre.lat, lonDeg: centre.lon }
  const lat = element['lat'] as number | undefined
  const lon = element['lon'] as number | undefined
  if (lat !== undefined && lon !== undefined) return { latDeg: lat, lonDeg: lon }
  return undefined
}

function cellKey(
  point: { latDeg: number; lonDeg: number },
  latStep: number,
  lonStep: number,
): string {
  return `${Math.floor(point.latDeg / latStep)}:${Math.floor(point.lonDeg / lonStep)}`
}

function cellAt(cells: Map<string, Cell>, key: string, city: City): Cell {
  let cell = cells.get(key)
  if (cell === undefined) {
    cell = {
      city,
      latDeg: 0,
      lonDeg: 0,
      pedestrian: 0,
      path: 0,
      street: 0,
      park: false,
      weightLat: 0,
      weightLon: 0,
    }
    cells.set(key, cell)
  }
  return cell
}

function binCity(city: City, response: OverpassResponse): { cells: Cell[]; places: Place[] } {
  const latStep = CELL_M / 111_320
  const lonStep = CELL_M / (111_320 * Math.cos(rad(city.latDeg)))
  const cells = new Map<string, Cell>()
  const places: Place[] = []

  for (const raw of response.elements) {
    const element = raw as unknown as Record<string, unknown>
    const tags = (element['tags'] as Record<string, string> | undefined) ?? {}
    /*
       A way returned by `out geom` carries its shape and no centre, which is
       exactly the set this function most needs — so the centre is optional
       here and only the elements that have nothing else are dropped. The
       first version guarded on it and silently skipped every pedestrian way
       in every city, reporting zero cells everywhere with no error at all.
    */
    const geometry = element['geometry'] as { lat: number; lon: number }[] | undefined
    const centre = centreOf(element)
    if (centre === undefined && geometry === undefined) continue

    if (element['type'] === 'node' && centre !== undefined) {
      const place = tags['place']
      const name = tags['name']
      if (place !== undefined && name !== undefined && place in PLACE_RANK) {
        places.push({ name, rank: PLACE_RANK[place] ?? 9, ...centre })
      }
      continue
    }

    const highway = tags['highway']
    const isPark = tags['leisure'] === 'park'
    if (highway === undefined && !isPark) continue

    if (isPark) {
      if (centre === undefined) continue
      const key = cellKey(centre, latStep, lonStep)
      cellAt(cells, key, city).park = true
      continue
    }

    if (highway !== undefined && PEDESTRIAN.has(highway) && geometry !== undefined) {
      /*
       * Segment by segment, into whichever cell each segment's midpoint falls
       * in. A way that runs across a boundary belongs to both cells in the
       * proportion it actually occupies them, which is what makes this a
       * density rather than a tally of things that happen to start nearby.
       */
      for (let i = 1; i < geometry.length; i += 1) {
        const a = geometry[i - 1]
        const b = geometry[i]
        if (a === undefined || b === undefined) continue
        const from = { latDeg: a.lat, lonDeg: a.lon }
        const to = { latDeg: b.lat, lonDeg: b.lon }
        const length = metresBetween(from, to)
        if (length === 0) continue
        const mid = { latDeg: (a.lat + b.lat) / 2, lonDeg: (a.lon + b.lon) / 2 }
        const cell = cellAt(cells, cellKey(mid, latStep, lonStep), city)
        cell.pedestrian += length
        if (highway === 'path') cell.path += length
        /* The centre of a cell is where its pedestrian network is, not the
           middle of an arbitrary grid square — a disc centred on the grid
           would sample half of the fabric that put the cell on the list. */
        cell.weightLat += mid.latDeg * length
        cell.weightLon += mid.lonDeg * length
      }
      continue
    }

    if (highway !== undefined && STREET.has(highway) && centre !== undefined) {
      cellAt(cells, cellKey(centre, latStep, lonStep), city).street += 1
    }
  }

  for (const cell of cells.values()) {
    if (cell.pedestrian > 0) {
      cell.latDeg = cell.weightLat / cell.pedestrian
      cell.lonDeg = cell.weightLon / cell.pedestrian
    }
  }
  return { cells: [...cells.values()].filter((cell) => cell.pedestrian > 0), places }
}

function nameFor(cell: Cell, places: readonly Place[]): string {
  let best: Place | undefined
  let bestScore = Infinity
  for (const place of places) {
    const distance = metresBetween(cell, place)
    if (distance > 1200) continue
    /* Prefer the more local name, then the nearer one: a neighbourhood two
       hundred metres away names a disc better than the city it sits in. */
    const score = place.rank * 1000 + distance
    if (score < bestScore) {
      bestScore = score
      best = place
    }
  }
  return best?.name ?? cell.city.name
}

const OUT_PATH = join(process.cwd(), 'data', 'candidates.json')

async function main(): Promise<void> {
  console.log(`Searching ${CITIES.length} cities for well-mapped ${CELL_M} m cells.`)
  console.log('Ranking on mapped pedestrian network only. Never on the metrics.\n')

  const taken: { latDeg: number; lonDeg: number }[] = SITES.map((site) => ({
    latDeg: site.centreLatDeg,
    lonDeg: site.centreLonDeg,
  }))
  const found: {
    label: string
    name: string
    city: string
    latDeg: number
    lonDeg: number
    pedestrianM: number
    streetWays: number
    pathShare: number
    park: boolean
  }[] = []

  for (const city of CITIES) {
    const slug = `discover-${city.key}`
    if (!hasCachedExtract(slug)) {
      const response = await fetchOverpass(query(city))
      await writeCachedExtract({
        slug,
        query: query(city),
        timestampOsmBase: response.osm3s?.timestamp_osm_base ?? 'unknown',
        response,
      })
      await pause(PAUSE_MS)
    }
    const cached = await readCachedExtract(slug)
    const { cells, places } = binCity(city, cached.response)

    /* Ranked by mapped pedestrian ways, then filtered for the things that make
       a cell worth an Overpass request: enough street network to be urban
       fabric rather than a trail head, and far enough from a site or another
       candidate to be a different place. */
    const ranked = cells
      .filter((cell) => cell.street >= 30 && cell.pedestrian >= MIN_PEDESTRIAN_M)
      .sort((a, b) => b.pedestrian - a.pedestrian)

    let kept = 0
    for (const cell of ranked) {
      if (kept >= 3) break
      const clash = [...taken, ...found].some(
        (other) => metresBetween(cell, other) < MIN_SEPARATION_M,
      )
      if (clash) continue
      taken.push({ latDeg: cell.latDeg, lonDeg: cell.lonDeg })
      const name = nameFor(cell, places)
      found.push({
        label: `${city.key}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        name,
        city: city.name,
        latDeg: Number(cell.latDeg.toFixed(4)),
        lonDeg: Number(cell.lonDeg.toFixed(4)),
        pedestrianM: Math.round(cell.pedestrian),
        streetWays: cell.street,
        pathShare: Number((cell.path / cell.pedestrian).toFixed(3)),
        park: cell.park,
      })
      kept += 1
    }
    console.log(
      `·  ${city.name.padEnd(14)} ${String(cells.length).padStart(3)} cells with footway, ` +
        `best cell ${((ranked[0]?.pedestrian ?? 0) / 1000).toFixed(1).padStart(5)} km, kept ${kept}`,
    )
  }

  found.sort((a, b) => b.pedestrianM - a.pedestrianM)
  console.log(`\n${found.length} candidate centres, best mapped first:\n`)
  for (const candidate of found) {
    console.log(
      `${(candidate.pedestrianM / 1000).toFixed(1).padStart(5)} km ped  ` +
        `${String(candidate.streetWays).padStart(4)} street  ` +
        `path ${(candidate.pathShare * 100).toFixed(0).padStart(3)}%  ` +
        `${candidate.park ? 'park ' : '     '}` +
        `${candidate.label.padEnd(34)} ${candidate.latDeg}, ${candidate.lonDeg}`,
    )
  }

  await writeFile(OUT_PATH, `${JSON.stringify(found, null, 2)}\n`, 'utf8')
  console.log(`\nWrote data/candidates.json — feed these to \`pnpm data:survey\`.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
