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

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildGraphFromWays,
  clipToRadius,
  coverageOfWalkGraph,
  totalLengthM,
} from '@/lib/morphology'
import { GOOD_COVERAGE_THRESHOLD, THIN_COVERAGE_THRESHOLD } from '@/lib/morphology'
import { DEFAULT_TAG_MAPPING } from '@/lib/tags'
import { ODBL_ATTRIBUTION, SAMPLING_RADIUS_M, SITES, surveySchema } from '@/data/sites'
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
 *
 * The second round widens the list on two axes that have nothing to do with
 * what the metrics will say, because neither may:
 *
 * **Geography.** The comparison set was Java plus Makassar plus a greenfield
 * capital. Sumatra, Bali, the Kalimantan river cities, Nusa Tenggara, Maluku
 * and Papua were absent entirely — so a page about Indonesian urban form was
 * measuring one island and calling it the country. Every region below is
 * represented by its oldest urban fabric, which is where the form is.
 *
 * **Where mapping actually happened.** Two kinds of place tend to have their
 * footways drawn: somewhere people walk for a living or a holiday, and
 * somewhere that has been through a humanitarian mapping activation. Banda
 * Aceh after 2004, Padang after 2009, Palu and Lombok after 2018 were mapped
 * in detail by people who needed to know where a stretcher could go. That is
 * a hypothesis about the data, not about the cities, and the survey is how it
 * gets tested rather than assumed.
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

  /* Sumatra — absent from the set entirely. */
  { label: 'aceh-peunayong', type: 'kolonial', latDeg: 5.5590, lonDeg: 95.3210, note: 'Banda Aceh, the Peunayong shophouse quarter — rebuilt and remapped after 2004' },
  { label: 'medan-kesawan', type: 'kolonial', latDeg: 3.5855, lonDeg: 98.6800, note: 'Medan, the Kesawan shophouse street and its blocks' },
  { label: 'padang-kota-tua', type: 'kolonial', latDeg: -0.9540, lonDeg: 100.3610, note: 'Padang, the old town on the Batang Arau' },
  { label: 'bukittinggi-jam-gadang', type: 'kampung', latDeg: -0.3055, lonDeg: 100.3691, note: 'Bukittinggi, the highland market town around the Jam Gadang' },
  { label: 'palembang-7-ulu', type: 'kampung', latDeg: -2.9960, lonDeg: 104.7620, note: 'Palembang, the Musi south bank at 7 Ulu' },

  /* Kalimantan — a set with IKN in it and no Kalimantan city in it. */
  { label: 'banjarmasin-kuin', type: 'kampung', latDeg: -3.3050, lonDeg: 114.5790, note: 'Banjarmasin, Kuin — a settlement whose streets are partly canals' },
  { label: 'pontianak-beting', type: 'kampung', latDeg: -0.0235, lonDeg: 109.3520, note: 'Pontianak, Kampung Beting on the Kapuas' },
  { label: 'balikpapan-klandasan', type: 'kota-baru', latDeg: -1.2665, lonDeg: 116.8290, note: 'Balikpapan, Klandasan — the oil town grid, and IKN’s nearest city' },

  /* Sulawesi beyond Makassar. */
  { label: 'manado-pasar-45', type: 'kolonial', latDeg: 1.4880, lonDeg: 124.8440, note: 'Manado, the Pasar 45 quarter' },

  /* Bali and Nusa Tenggara. */
  { label: 'sanur-denpasar', type: 'kampung', latDeg: -8.6900, lonDeg: 115.2600, note: 'Sanur, where the beach path and the gang were mapped for walkers' },
  { label: 'mataram-ampenan', type: 'kolonial', latDeg: -8.5730, lonDeg: 116.0720, note: 'Ampenan, Lombok — the old port town, remapped after 2018' },
  { label: 'kupang-kota-lama', type: 'kolonial', latDeg: -10.1650, lonDeg: 123.5820, note: 'Kupang, the old town by the bay' },

  /* Maluku and Papua. */
  { label: 'ambon-kota', type: 'kolonial', latDeg: -3.6954, lonDeg: 128.1814, note: 'Ambon, the town centre between the bay and the hills' },
  { label: 'jayapura-kota', type: 'kolonial', latDeg: -2.5333, lonDeg: 140.7181, note: 'Jayapura, the centre on its shelf of flat ground' },

  /* Java, where the set has gaps rather than absences. */
  { label: 'surabaya-tunjungan', type: 'kolonial', latDeg: -7.2620, lonDeg: 112.7390, note: 'Surabaya, Tunjungan — the commercial spine' },
  { label: 'cirebon-kanoman', type: 'kampung', latDeg: -6.7060, lonDeg: 108.5720, note: 'Cirebon, the kampung around the Kanoman kraton and market' },
  { label: 'solo-baluwarti', type: 'kampung', latDeg: -7.5750, lonDeg: 110.8280, note: 'Surakarta, Baluwarti — the kampung inside the kraton walls' },
  { label: 'bogor-suryakencana', type: 'kampung', latDeg: -6.5950, lonDeg: 106.7960, note: 'Bogor, the Suryakencana pecinan' },

  /*
   * Planned housing, again. Every gated perumahan surveyed in the first round
   * came back thin, which bounds what the kampung-versus-perumahan comparison
   * can say — so it is worth asking a second set whether that is a property of
   * gated housing or of the four that were asked.
   */
  { label: 'perumahan-lippo-karawaci', type: 'perumahan', latDeg: -6.2245, lonDeg: 106.6110, note: 'Lippo Karawaci, Tangerang' },
  { label: 'perumahan-bintaro-sektor-9', type: 'perumahan', latDeg: -6.2760, lonDeg: 106.7050, note: 'Bintaro Jaya sektor 9' },
  { label: 'perumahan-kota-wisata', type: 'perumahan', latDeg: -6.3730, lonDeg: 106.9330, note: 'Kota Wisata, Cibubur' },
  { label: 'kota-baru-batam-nagoya', type: 'kota-baru', latDeg: 1.1466, lonDeg: 104.0090, note: 'Batam, Nagoya — the unplanned centre of a planned island' },
  { label: 'kota-baru-batam-centre', type: 'kota-baru', latDeg: 1.1200, lonDeg: 104.0490, note: 'Batam Centre, the administrative core laid out from nothing' },

  /*
   * Second centres, asked because the first one answered the wrong question.
   *
   * Suryakencana came back the best-covered candidate in the whole survey and
   * a third of its footway length is inside the Kebun Raya. A botanical
   * garden's paths are `highway=footway` like any gang, so coverage — which
   * exists to say whether the *alleys* are mapped — reads high for a reason
   * that has nothing to do with the fabric. These two centres put the garden
   * outside the disc and ask Bogor again.
   */
  { label: 'bogor-empang', type: 'kampung', latDeg: -6.6080, lonDeg: 106.7960, note: 'Bogor, the Empang kampung south of the pecinan' },
  { label: 'bogor-bantarjati', type: 'kampung', latDeg: -6.5790, lonDeg: 106.8000, note: 'Bogor, Bantarjati — dense kampung north of the garden' },

  /* Two more shapes worth asking about while the survey is running. */
  { label: 'cakranegara-mataram', type: 'kolonial', latDeg: -8.5830, lonDeg: 116.1200, note: 'Cakranegara, Lombok — a pre-colonial planned grid, laid out on a Balinese ward plan' },
  { label: 'ternate-kota', type: 'kampung', latDeg: 0.7900, lonDeg: 127.3800, note: 'Ternate, the town between the fort and the volcano' },
]

const FETCH_MARGIN = 1.4
const PAUSE_MS = 3000

/**
 * Why a candidate that cleared the threshold is not in the set.
 *
 * There is one, and it is the best-covered candidate in the whole survey.
 * Suryakencana measures 40.9% because roughly a third of the footway length
 * inside its disc is the Kebun Raya — a botanical garden whose paths are
 * `highway=footway` exactly like a gang, and which coverage therefore counts
 * exactly like a gang.
 *
 * That is a limit of the proxy rather than a fact about Bogor. Coverage exists
 * to answer one question — are the alleys mapped — and a large park inside the
 * disc answers a different one loudly. So the centre was moved 1.4 km south to
 * Empang, where the garden is 7% of the pedestrian length instead of a third,
 * and Bogor is in the set on a figure that means what it says.
 *
 * The rejected centre stays in the survey with this sentence attached. A
 * published survey whose best-covered row reads "not adopted" and gives no
 * reason invites the obvious inference, and the inference would be wrong.
 */
const WITHHELD: Readonly<Record<string, string>> = {
  'bogor-suryakencana':
    'Around a third of the footway length inside this disc is inside the Kebun Raya. Garden paths are tagged like gang and counted like gang, so the figure measures the botanical garden rather than the fabric. Bogor is in the set at Empang, 1.4 km south, where the garden is 7% of the pedestrian length.',
}

/** Same rounding convention as the pipeline, for the same determinism reason. */
function round(value: number, places: number): number {
  const factor = 10 ** places
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}

interface Result {
  readonly candidate: Candidate
  readonly pedestrianShare: number
  readonly pedestrianLengthM: number
  readonly walkLengthM: number
  readonly driveLengthM: number
  readonly confidence: 'thin' | 'moderate' | 'good'
  readonly extractVersion: string
}

/**
 * Where the survey is written.
 *
 * `data/out` is wiped and rebuilt by `data:build`, and the survey is not built
 * from the same inputs — it is measured against candidate centres, some of
 * which are deliberately not sites. So it is a committed source file of its
 * own, published alongside the derived database because it is one: same
 * radius, same mapping, same code, ODbL like everything else.
 */
const SURVEY_PATH = join(process.cwd(), 'data', 'survey.json')

/**
 * Which candidates became sites. Matched by centre rather than by name,
 * because the survey labels and the site slugs are written independently and a
 * name match would silently drift. Within about 60 m is the same disc.
 */
function adoptedAs(candidate: Candidate): string | null {
  const match = SITES.find(
    (site) =>
      Math.abs(site.centreLatDeg - candidate.latDeg) < 0.0006 &&
      Math.abs(site.centreLonDeg - candidate.lonDeg) < 0.0006,
  )
  return match?.slug ?? null
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
    extractVersion: cached.timestampOsmBase,
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
  console.log(`\n${good.length} of ${sorted.length} candidates clear the thin threshold.`)

  /*
   * Written, not just printed.
   *
   * The measurement of a rejected candidate is a result — it is the evidence
   * that the sixteen sites were chosen on data completeness and not on their
   * numbers, and it is the only place the project says out loud how much of
   * Indonesia it cannot currently ask the question of. Leaving it in stdout
   * meant the argument in this file's header was addressed to nobody.
   */
  const survey = surveySchema.parse({
    radiusM: SAMPLING_RADIUS_M,
    mappingId: DEFAULT_TAG_MAPPING.id,
    thinThreshold: THIN_COVERAGE_THRESHOLD,
    goodThreshold: GOOD_COVERAGE_THRESHOLD,
    candidates: sorted.map((result) => ({
      label: result.candidate.label,
      type: result.candidate.type,
      latDeg: result.candidate.latDeg,
      lonDeg: result.candidate.lonDeg,
      note: result.candidate.note,
      pedestrianShare: round(result.pedestrianShare, 6),
      pedestrianLengthM: round(result.pedestrianLengthM, 2),
      walkLengthM: round(result.walkLengthM, 2),
      driveLengthM: round(result.driveLengthM, 2),
      confidence: result.confidence,
      adoptedAs: adoptedAs(result.candidate),
      withheld: WITHHELD[result.candidate.label] ?? null,
      extractVersion: result.extractVersion,
    })),
    attribution: ODBL_ATTRIBUTION,
    licence: 'ODbL-1.0',
  })

  await writeFile(SURVEY_PATH, `${JSON.stringify(survey, null, 2)}\n`, 'utf8')
  console.log(`Wrote data/survey.json — ${survey.candidates.length} candidates, committed.`)
  console.log(`Extracts cached under ${cachePathFor('survey-…')} — git-ignored, never committed.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
