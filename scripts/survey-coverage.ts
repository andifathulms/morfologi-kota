/**
 * DEV — survey candidate centres for footway coverage before adopting them.
 *
 * The binding constraint on this project's headline finding is not the code; it
 * is whether *gang* are mapped in OpenStreetMap (PRD §4, §12). A site whose
 * alleys are absent produces a walking network that collapses onto its driving
 * network, and a comparison that says nothing about the place.
 *
 * So candidate sites are measured before they are adopted, at the same radius
 * and under the same tag mapping the pipeline uses — which is the whole point:
 * a survey that sampled differently from the pipeline would not predict
 * anything.
 *
 * This selects on *data completeness*, never on the metrics. Picking sites by
 * their entropy or their dead-end ratio would be choosing the finding in
 * advance; picking them by whether the survey exists is choosing whether a
 * finding is possible at all.
 *
 *   pnpm data:survey
 */

import {
  buildGraphFromWays,
  clipToRadius,
  coverageOfWalkGraph,
  totalLengthM,
} from '@/lib/morphology'
import { DEFAULT_TAG_MAPPING } from '@/lib/tags'
import { SAMPLING_RADIUS_M, SITES } from '@/data/sites'
import {
  cachePathFor,
  extractQuery,
  fetchOverpass,
  hasCachedExtract,
  pause,
  readCachedExtract,
  splitElements,
  writeCachedExtract,
} from './osm'

interface Candidate {
  readonly label: string
  readonly type: string
  readonly latDeg: number
  readonly lonDeg: number
  readonly note: string
}

/**
 * Candidates are drawn from cities with active OpenStreetMap communities and
 * from areas that have been through organised mapping — Yogyakarta, Surabaya,
 * Denpasar and the Ciliwung kampung in Jakarta, which were surveyed in detail
 * for flood-risk work. Whether that actually produced footway coverage is what
 * this script is for.
 */
const CANDIDATES: readonly Candidate[] = [
  { label: 'kampung-kali-code-utara', type: 'kampung', latDeg: -7.7805, lonDeg: 110.3695, note: 'Kali Code, north of the bridge' },
  { label: 'kampung-prawirotaman', type: 'kampung', latDeg: -7.8195, lonDeg: 110.3675, note: 'Yogyakarta, dense kampung behind the guesthouses' },
  { label: 'kampung-kotagede', type: 'kampung', latDeg: -7.8265, lonDeg: 110.3975, note: 'Kotagede, the old Mataram core' },
  { label: 'kampung-pakualaman', type: 'kampung', latDeg: -7.7985, lonDeg: 110.3760, note: 'Yogyakarta, inside the Pakualaman walls' },
  { label: 'kampung-ketandan-solo', type: 'kampung', latDeg: -7.5705, lonDeg: 110.8290, note: 'Surakarta, Pasar Gede area' },
  { label: 'kampung-ampel-surabaya', type: 'kampung', latDeg: -7.2305, lonDeg: 112.7420, note: 'Ampel, Surabaya' },
  { label: 'kampung-lawang-seketeng', type: 'kampung', latDeg: -7.2555, lonDeg: 112.7395, note: 'Peneleh / Lawang Seketeng, Surabaya' },
  { label: 'kampung-ciliwung-bukit-duri', type: 'kampung', latDeg: -6.2245, lonDeg: 106.8580, note: 'Bukit Duri, on the Ciliwung' },
  { label: 'kampung-kebon-kacang', type: 'kampung', latDeg: -6.1885, lonDeg: 106.8175, note: 'Kebon Kacang, behind Tanah Abang' },
  { label: 'kampung-pulo', type: 'kampung', latDeg: -6.2265, lonDeg: 106.8655, note: 'Kampung Pulo, Jatinegara' },
  { label: 'kampung-braga-bandung', type: 'kampung', latDeg: -6.9175, lonDeg: 107.6095, note: 'Bandung, behind Braga' },
  { label: 'kampung-cicadas-bandung', type: 'kampung', latDeg: -6.9060, lonDeg: 107.6395, note: 'Cicadas, Bandung' },
  { label: 'kampung-denpasar-gemeh', type: 'kampung', latDeg: -8.6560, lonDeg: 115.2175, note: 'Denpasar, Gemeh' },
  { label: 'kampung-ubud', type: 'kampung', latDeg: -8.5065, lonDeg: 115.2625, note: 'Ubud, where the paths are mapped for walkers' },
  { label: 'kampung-legian', type: 'kampung', latDeg: -8.7045, lonDeg: 115.1690, note: 'Legian, gang between the lanes' },
  { label: 'kampung-malang-kayutangan', type: 'kampung', latDeg: -7.9755, lonDeg: 112.6295, note: 'Kayutangan, Malang' },
  { label: 'kampung-semarang-kauman', type: 'kampung', latDeg: -6.9755, lonDeg: 110.4265, note: 'Kauman, Semarang' },
  { label: 'perumahan-citraland', type: 'perumahan', latDeg: -7.2855, lonDeg: 112.6520, note: 'CitraLand, Surabaya' },
  { label: 'perumahan-summarecon-bekasi', type: 'perumahan', latDeg: -6.2265, lonDeg: 106.9975, note: 'Summarecon Bekasi' },
  { label: 'perumahan-sentul-city', type: 'perumahan', latDeg: -6.5605, lonDeg: 106.8425, note: 'Sentul City' },
  { label: 'kota-baru-pantai-indah-kapuk', type: 'kota-baru', latDeg: -6.1035, lonDeg: 106.7395, note: 'Pantai Indah Kapuk' },
  { label: 'kolonial-kota-lama-surabaya', type: 'kolonial', latDeg: -7.2335, lonDeg: 112.7345, note: 'Surabaya, the old European quarter' },
]

const FETCH_MARGIN = 1.4
const PAUSE_MS = 3000

interface Result {
  readonly candidate: Candidate
  readonly pedestrianShare: number
  readonly pedestrianLengthM: number
  readonly walkLengthM: number
  readonly driveLengthM: number
  readonly confidence: string
}

async function measure(candidate: Candidate): Promise<Result> {
  const slug = `survey-${candidate.label}`
  if (!hasCachedExtract(slug)) {
    const query = extractQuery(candidate.latDeg, candidate.lonDeg, SAMPLING_RADIUS_M * FETCH_MARGIN)
    const response = await fetchOverpass(query)
    await writeCachedExtract({
      slug,
      query,
      timestampOsmBase: response.osm3s?.timestamp_osm_base ?? 'unknown',
      response,
    })
    await pause(PAUSE_MS)
  }

  const cached = await readCachedExtract(slug)
  const extract = splitElements(cached.response)
  const build = (mode: 'drive' | 'walk') =>
    clipToRadius(
      buildGraphFromWays(
        { nodes: extract.nodes, ways: extract.ways },
        {
          centreLonDeg: candidate.lonDeg,
          centreLatDeg: candidate.latDeg,
          mode,
          mapping: DEFAULT_TAG_MAPPING,
        },
      ),
      SAMPLING_RADIUS_M,
    )

  const walk = build('walk')
  const drive = build('drive')
  const coverage = coverageOfWalkGraph(walk, SAMPLING_RADIUS_M)

  return {
    candidate,
    pedestrianShare: coverage.pedestrianShare,
    pedestrianLengthM: coverage.pedestrianLengthM,
    walkLengthM: coverage.walkLengthM,
    driveLengthM: totalLengthM(drive),
    confidence: coverage.confidence.type,
  }
}

async function main(): Promise<void> {
  console.log(`Surveying ${CANDIDATES.length} candidate centres at r=${SAMPLING_RADIUS_M} m,`)
  console.log(`tag mapping "${DEFAULT_TAG_MAPPING.id}" — the same sampling the pipeline uses.`)
  console.log('Selecting on data completeness only. Never on the metrics.\n')

  const results: Result[] = []
  for (const candidate of CANDIDATES) {
    process.stdout.write(`·  ${candidate.label.padEnd(32)}`)
    const result = await measure(candidate)
    results.push(result)
    console.log(
      `cov ${(result.pedestrianShare * 100).toFixed(1).padStart(5)}%  ` +
        `gang ${(result.pedestrianLengthM / 1000).toFixed(1).padStart(5)} km  ` +
        `walk ${(result.walkLengthM / 1000).toFixed(1).padStart(5)} km  ` +
        `${result.confidence}`,
    )
  }

  console.log('\nBest covered first:\n')
  const sorted = [...results].sort((a, b) => b.pedestrianShare - a.pedestrianShare)
  for (const result of sorted) {
    const flag = result.confidence === 'thin' ? '⚑' : result.confidence === 'good' ? '✓' : '·'
    console.log(
      `${flag} ${(result.pedestrianShare * 100).toFixed(1).padStart(5)}%  ` +
        `${result.candidate.label.padEnd(32)} ${result.candidate.type.padEnd(10)} ` +
        `${result.candidate.latDeg}, ${result.candidate.lonDeg}  ${result.candidate.note}`,
    )
  }

  const good = sorted.filter((r) => r.confidence !== 'thin')
  console.log(
    `\n${good.length} of ${sorted.length} candidates clear the thin threshold, against ` +
      `${SITES.length - 9} of ${SITES.length} sites currently in the set.`,
  )
  console.log(`Cached under ${cachePathFor('survey-…')} — git-ignored, never committed.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
