import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { loadManifest, loadSurvey } from '@/lib/data'
import { LOCALES, SITE_TYPE_LABEL, d, isLocale, t, type Locale, type Bilingual } from '@/lib/i18n'
import { DEFAULT_TAG_MAPPING } from '@/lib/tags'
import { GOOD_COVERAGE_THRESHOLD, THIN_COVERAGE_THRESHOLD } from '@/lib/morphology'
import { percent } from '@/lib/format'
import { manifestDataPath, siteDataPath, surveyDataPath } from '@/lib/paths'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  return {
    title: locale === 'id' ? 'Metode — definisi, batasan, dan lisensi · Bentuk Kota' : 'Method — definitions, limitations and licence · Bentuk Kota',
    alternates: { canonical: `/${locale}/metode/` },
  }
}

/**
 * Method (PRD §6.8) — the citation, the definitions, the tag mapping, the
 * sampling radius, the ODbL attribution, and every one of the honesty
 * constraints in §4, stated rather than implied.
 */

/**
 * Coverage confidence in words.
 *
 * The same three values the coverage table on the assumptions page prints, and
 * they must read the same on both pages: the survey and the comparison set are
 * measured against one threshold, so they cannot be labelled two ways.
 */
function confidenceLabel(confidence: 'thin' | 'moderate' | 'good', locale: Locale): string {
  switch (confidence) {
    case 'thin':
      return d('coverageThin', locale)
    case 'moderate':
      return d('coverageModerate', locale)
    case 'good':
      return d('coverageGood', locale)
    default: {
      const never: never = confidence
      throw new Error(`unknown confidence: ${String(never)}`)
    }
  }
}

const definitions: readonly { term: string; body: Bilingual }[] = [
  {
    term: 'Orientation entropy — H',
    body: {
      id: 'Entropi Shannon dari arah ruas jalan, dibagi ke 36 bin selebar 10°, ditimbang panjang. H = −Σ P(i)·ln P(i). Maksimumnya ln 36 ≈ 3,584 ketika setiap bin terisi sama; petak sempurna memberi ln 4 ≈ 1,386.',
      en: 'Shannon entropy of street bearings binned into 36 bins of 10°, length-weighted. H = −Σ P(i)·ln P(i). Its maximum is ln 36 ≈ 3.584 when every bin is equally occupied; a perfect grid gives ln 4 ≈ 1.386.',
    },
  },
  {
    term: 'φ — orientation-order',
    body: {
      id: 'φ = 1 − ((H − H_g) / (H_max − H_g))², dengan H_g = ln 4 dan H_max = ln 36. φ = 1 adalah satu petak sempurna, φ = 0 jaringan yang sepenuhnya tak teratur. Ini ukuran seberapa dekat sebuah jaringan mengikuti logika satu petak — bukan ukuran mutu.',
      en: 'φ = 1 − ((H − H_g) / (H_max − H_g))², with H_g = ln 4 and H_max = ln 36. φ = 1 is a single perfect grid, φ = 0 a perfectly disordered network. It measures how closely a network follows the logic of one grid — it is not a quality.',
    },
  },
  {
    term: 'Circuity',
    body: {
      id: 'Rata-rata jarak jaringan dibagi jarak garis lurus, atas sampel pasangan simpul yang ditarik dengan benih tetap. Nilainya selalu ≥ 1 menurut definisi; kalau kurang, perhitungan jaraknya rusak.',
      en: 'Mean network distance over straight-line distance across a seeded sample of node pairs. It is ≥ 1 by definition; below 1 means the distance calculation is broken.',
    },
  },
  {
    term: 'Average node degree',
    body: {
      id: 'Jumlah derajat dibagi jumlah simpul, dengan simpul dihitung dari ujung ruas. Ruas jalan dipecah di setiap persimpangan, sehingga derajat simpul berarti derajat persimpangan.',
      en: 'Degree sum over node count, counting edge ends. Ways are split at every junction, so node degree means intersection degree.',
    },
  },
  {
    term: 'Four-way · dead-end',
    body: {
      id: 'Proporsi simpul berderajat tepat empat, dan proporsi simpul berderajat satu. Seluruh proporsi derajat berjumlah tepat satu, dan itu diuji.',
      en: 'Proportion of nodes of degree exactly four, and of degree one. The degree proportions sum to exactly one, and that is asserted in the test suite.',
    },
  },
  {
    term: 'Intersection density',
    body: {
      id: 'Jumlah simpul berderajat ≥ 3 per kilometer persegi cakram sampel.',
      en: 'Count of nodes of degree ≥ 3 per square kilometre of the sampling disc.',
    },
  },
  {
    term: 'Footway coverage',
    body: {
      id: `Bagian panjang jaringan pejalan kaki yang berupa kelas khusus pejalan kaki — footway, path, pedestrian, steps, corridor. Di bawah ${percent(THIN_COVERAGE_THRESHOLD, 0)} lokasi ditandai tipis; di atas ${percent(GOOD_COVERAGE_THRESHOLD, 0)} disebut cukup.`,
      en: `Share of walking-network length carried by pedestrian-only classes — footway, path, pedestrian, steps, corridor. Below ${percent(THIN_COVERAGE_THRESHOLD, 0)} a site is flagged thin; above ${percent(GOOD_COVERAGE_THRESHOLD, 0)} it is called good.`,
    },
  },
]

/** Counted from the manifest, so the sentence cannot drift from the data. */
const limitationsFor = (thin: number, total: number): readonly Bilingual[] => [
  {
    id: `Temuan utama bergantung pada gang yang terpetakan. ${thin} dari ${total} lokasi di sini bertanda cakupan tipis, dan untuk lokasi-lokasi itu selisih kendara/jalan kaki tidak dapat dibaca sebagai temuan tentang tempatnya. Itu temuan tentang datanya.`,
    en: `The headline finding depends on gang being mapped. ${thin} of the ${total} sites here carry a thin-coverage flag, and for those the drive/walk gap cannot be read as a finding about the place. It is a finding about the data.`,
  },
  {
    id: 'Interpretasi tag adalah pilihan pemodelan. Halaman Asumsi menunjukkan berapa jauh angkanya bergerak jika pilihannya diubah.',
    en: 'Tag interpretation is a modelling choice. The Assumptions page shows how far the numbers move when it is changed.',
  },
  {
    id: 'Jari-jari sampel mengubah hasil, jadi ia tetap sama untuk seluruh kumpulan dan dicetak di setiap kartu.',
    en: 'The sampling radius changes results, so it is fixed across the whole set and printed on every card.',
  },
  {
    id: 'Tidak ada lokasi yang dinilai baik atau buruk. Morfologi yang berbeda melayani hal yang berbeda; konektivitas tinggi tidak selalu lebih baik, dan kampung-lawan-perumahan membawa muatan kelas di Indonesia yang justru akan diperkeruh oleh sebuah sistem skor. Alat ini menjelaskan, bukan menilai.',
    en: 'No site is rated good or bad. Different morphologies serve different things; high connectivity is not universally better, and kampung-versus-perumahan carries class overtones in Indonesia that a scoring system would inflame. This describes; it does not score.',
  },
  {
    id: 'Tidak ada rute, navigasi, atau perkiraan waktu tempuh. Tidak ada lapisan demografi, pendapatan, atau nilai lahan. Tidak ada rekomendasi kebijakan.',
    en: 'No routing, navigation or travel-time estimates. No demographic, income or land-value overlay. No policy recommendation.',
  },
]

export default function MethodPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const manifest = loadManifest()
  const survey = loadSurvey()

  /*
   * Counted from the survey, never written down. A number in prose that says
   * five when the file says six is the kind of thing nobody notices.
   */
  const cleared = survey.candidates.filter((candidate) => candidate.confidence !== 'thin').length
  const perumahanCandidates = survey.candidates.filter(
    (candidate) => candidate.type === 'perumahan',
  )
  const perumahanShares = perumahanCandidates.map((candidate) => candidate.pedestrianShare)
  const perumahanRange =
    perumahanShares.length === 0
      ? '—'
      : `${percent(Math.min(...perumahanShares))}–${percent(Math.max(...perumahanShares))}`
  const limitations = limitationsFor(
    manifest.sites.filter((site) => site.coverage.confidence.type === 'thin').length,
    manifest.sites.length,
  )

  return (
    <div className="max-w-prose">
      <h1 className="m-0 font-serif text-2xl font-semibold leading-tight">
        {locale === 'id' ? 'Metode' : 'Method'}
      </h1>

      <section className="mt-8">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Rujukan metode' : 'Method reference'}
        </h2>
        <p className="mt-2 font-mono text-xs leading-relaxed">
          {manifest.method.citation}{' '}
          <a href={`https://doi.org/${manifest.method.doi}`}>DOI {manifest.method.doi}</a>
        </p>
        <p className="mt-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Boeing mengukur morfologi jaringan jalan seratus kota memakai OpenStreetMap: entropi arah jalan, panjang ruas tipikal, circuity rata-rata, derajat simpul rata-rata, serta proporsi simpang empat dan jalan buntu — ditambah indikator keteraturan φ. Yang dikerjakan di sini bukan sekadar menerapkan metode itu ke Indonesia, melainkan menghitung dua jaringan untuk tempat yang sama dan menampilkan selisihnya.'
            : 'Boeing measures the street network morphology of a hundred cities using OpenStreetMap: the entropy of street bearings, typical segment length, average circuity, average node degree, and the proportions of four-way intersections and dead-ends — plus the orientation-order indicator φ. What is done here is not simply applying that method to Indonesia; it is computing both networks for the same place and showing the gap.'}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Parameter' : 'Parameters'}
        </h2>
        <dl className="tabular mt-2 grid grid-cols-[auto_1fr] gap-x-6 font-mono text-xs">
          <dt className="text-ink-subtle">{locale === 'id' ? 'Jari-jari sampel' : 'Sampling radius'}</dt>
          <dd className="m-0">{manifest.radiusM} m</dd>
          <dt className="text-ink-subtle">{locale === 'id' ? 'Jumlah bin' : 'Bin count'}</dt>
          <dd className="m-0">{manifest.binCount}</dd>
          <dt className="text-ink-subtle">{locale === 'id' ? 'Penimbang' : 'Weighting'}</dt>
          <dd className="m-0">{locale === 'id' ? 'panjang ruas' : 'segment length'}</dd>
          <dt className="text-ink-subtle">{locale === 'id' ? 'Pemetaan tag' : 'Tag mapping'}</dt>
          <dd className="m-0">{manifest.mappingId}</dd>
          <dt className="text-ink-subtle">{locale === 'id' ? 'Versi ekstrak' : 'Extract version'}</dt>
          <dd className="m-0">{manifest.extractVersion}</dd>
          <dt className="text-ink-subtle">{locale === 'id' ? 'Jumlah lokasi' : 'Sites'}</dt>
          <dd className="m-0">{manifest.sites.length}</dd>
        </dl>
        <p className="mt-4 font-serif text-md leading-relaxed">
          {t(DEFAULT_TAG_MAPPING.note, locale)}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Definisi' : 'Definitions'}
        </h2>
        <dl className="mt-4">
          {definitions.map((definition) => (
            <div key={definition.term} className="mt-4 border-t border-rule-strong pt-2">
              <dt className="font-mono text-xs font-semibold">{definition.term}</dt>
              <dd className="m-0 mt-1 font-serif text-md leading-relaxed">
                {t(definition.body, locale)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Bagaimana angkanya diuji' : 'How the numbers are tested'}
        </h2>
        <p className="mt-2 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Tidak ada oracle data, tetapi jaringan dengan sifat yang sudah diketahui dapat dibangun. Petak sempurna harus memberi empat bin terisi dan entropi minimum; petak yang sama diputar 29° harus memberi entropi identik dengan bin bergeser; graf geometrik acak harus mendekati entropi maksimum; pohon murni harus memberi proporsi jalan buntu persis seperti konstruksinya. Setiap histogram wajib simetris 180° — kalau tidak, perhitungan arahnya salah. Circuity wajib ≥ 1 pada setiap pasangan sampel. Semua itu menjadi syarat build.'
            : 'There is no data oracle, but networks with known properties can be constructed. A perfect grid must give four populated bins and minimum entropy; the same grid rotated 29° must give identical entropy with shifted bins; a random geometric graph must approach maximum entropy; a pure tree must give its constructed dead-end proportion exactly. Every histogram must be 180°-symmetric — if it is not, the bearing computation is wrong. Circuity must be ≥ 1 on every sampled pair. All of it gates the build.'}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Batasan' : 'Limitations'}
        </h2>
        {limitations.map((limitation, index) => (
          <p key={index} className="mt-4 font-serif text-md leading-relaxed">
            {t(limitation, locale)}
          </p>
        ))}
      </section>

      {/*
       * Site selection, documented.
       *
       * `data:survey` has always measured candidate centres before they were
       * adopted, at the same radius under the same mapping, selecting on data
       * completeness and never on the metrics — because choosing sites by
       * their entropy would be choosing the finding in advance (PRD §4). That
       * argument used to live in a script's header and its results in stdout,
       * so a sceptical reader had no way to check either. Here they are.
       */}
      <section className="mt-12">
        <h2 id="pemilihan" className="m-0 font-serif text-lg font-semibold">
          {d('selectionHeading', locale)}
        </h2>
        <p className="mt-2 max-w-prose font-serif text-md leading-relaxed">
          {locale === 'id'
            ? `Kandidat diukur sebelum diadopsi, pada jari-jari yang sama (${survey.radiusM} m) dan pemetaan tag yang sama (“${survey.mappingId}”) dengan yang dipakai pipeline — survei yang menyampel berbeda tidak akan memprediksi apa pun. Pemilihan dilakukan atas dasar kelengkapan data saja, tidak pernah atas dasar metriknya: memilih lokasi menurut entropinya berarti memilih temuan sejak awal.`
            : `Candidates are measured before they are adopted, at the same radius (${survey.radiusM} m) and under the same tag mapping (“${survey.mappingId}”) the pipeline uses — a survey that sampled differently would predict nothing. Selection is on data completeness only, never on the metrics: picking sites by their entropy would be choosing the finding in advance.`}
        </p>
        <p className="mt-4 max-w-prose border-l-2 border-ink-subtle pl-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? `${cleared} dari ${survey.candidates.length} kandidat yang disurvei melewati ambang cakupan tipis (${percent(survey.thinThreshold, 0)}). Dari ${perumahanCandidates.length} kandidat perumahan kluster, tidak satu pun lolos — ${perumahanRange}. Itulah batas dari apa yang dapat dikatakan perbandingan kampung-versus-perumahan saat ini, dan itu pernyataan tentang OpenStreetMap, bukan tentang tempat-tempatnya: gangnya belum terpetakan, bukan tidak ada.`
            : `${cleared} of ${survey.candidates.length} surveyed candidates clear the thin-coverage threshold (${percent(survey.thinThreshold, 0)}). Of the ${perumahanCandidates.length} perumahan cluster candidates, not one does — ${perumahanRange}. That bounds what the kampung-versus-perumahan comparison can currently say, and it is a statement about OpenStreetMap rather than about the places: the gang are unmapped, not absent.`}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="tabular w-full border-collapse font-mono text-xs">
            <caption className="sr-only">
              {locale === 'id'
                ? 'Kandidat yang disurvei, diurutkan menurut cakupan gang, dengan status adopsinya.'
                : 'Surveyed candidates, sorted by footway coverage, with whether each was adopted.'}
            </caption>
            <thead>
              <tr className="border-b border-rule-strong text-left">
                <th scope="col" className="py-1 pr-4 font-normal">
                  {d('surveyCandidate', locale)}
                </th>
                <th scope="col" className="py-1 pr-4 font-normal">
                  {locale === 'id' ? 'Jenis' : 'Type'}
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-normal">
                  {d('coverage', locale)}
                </th>
                <th scope="col" className="py-1 pr-4 font-normal">
                  {locale === 'id' ? 'Keyakinan' : 'Confidence'}
                </th>
                <th scope="col" className="py-1 pr-4 font-normal">
                  {d('surveyStatus', locale)}
                </th>
              </tr>
            </thead>
            <tbody>
              {survey.candidates.map((candidate) => (
                <tr key={candidate.label} className="border-b border-rule-faint">
                  <th scope="row" className="py-px pr-4 text-left font-normal">
                    {candidate.label}
                    {/*
                      The survey notes are written in English in the source
                      data, so they are marked as English rather than left for
                      a screen reader to pronounce as Indonesian. Translating
                      them properly means widening the survey schema to a
                      bilingual field and re-running the survey — a data
                      change, not a presentation one.
                    */}
                    <span lang="en" className="ml-2 text-ink-subtle">
                      {candidate.note}
                    </span>
                  </th>
                  <td className="py-px pr-4 text-ink-subtle">
                    {t(
                      SITE_TYPE_LABEL[candidate.type] ?? { id: candidate.type, en: candidate.type },
                      locale,
                    )}
                  </td>
                  <td className="py-px pr-4 text-right">{percent(candidate.pedestrianShare)}</td>
                  <td className="py-px pr-4">
                    {candidate.confidence === 'thin' ? '⚑ ' : ''}
                    {confidenceLabel(candidate.confidence, locale)}
                  </td>
                  <td className="py-px pr-4">
                    {candidate.adoptedAs === null ? (
                      <span className="text-ink-subtle">{d('surveyNotAdopted', locale)}</span>
                    ) : (
                      <Link href={`/${locale}/lokasi/${candidate.adoptedAs}`}>
                        {d('surveyAdopted', locale)}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-prose font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Kandidat di bawah ambang tidak dibuang diam-diam — ia diukur, dicatat, dan ditampilkan di sini. Menambahkan kluster perumahan yang terpetakan rapat, atau memetakannya, masih menjadi hal paling berguna yang bisa dilakukan siapa pun terhadap proyek ini.'
            : 'A candidate below the threshold is not quietly discarded — it is measured, recorded, and shown here. Adding a well-mapped perumahan cluster, or mapping one, remains the single most useful thing anyone could do to this project.'}
        </p>
        <p className="mt-2 font-mono text-xs leading-relaxed">
          <a href={surveyDataPath()} download>
            {d('downloadSurvey', locale)}
          </a>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Data dan lisensi' : 'Data and licence'}
        </h2>
        <p className="mt-2 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Geometri jalan berasal dari OpenStreetMap, © OpenStreetMap contributors, tersedia di bawah Open Database License (ODbL) 1.0. Geometri dan metrik yang dihasilkan di sini adalah basis data turunan, sehingga membawa ODbL dan ditawarkan dengan lisensi yang sama.'
            : 'Street geometry comes from OpenStreetMap, © OpenStreetMap contributors, available under the Open Database License (ODbL) 1.0. The geometry and metrics emitted here are a derived database, so they carry ODbL and are offered under the same terms.'}
        </p>
        <p className="mt-2 font-mono text-xs leading-relaxed">
          <a href="https://www.openstreetmap.org/copyright">openstreetmap.org/copyright</a> ·{' '}
          <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL 1.0</a>
        </p>
        <p className="mt-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Ekstrak diambil pada saat build, tidak pernah saat halaman dibuka. Setelah muat pertama, halaman ini tidak melakukan permintaan jaringan apa pun.'
            : 'Extracts are fetched at build time, never at page load. After the first load this page makes no network request at all.'}
        </p>

        <h3 className="mt-8 font-serif text-md font-semibold">
          {locale === 'id' ? 'Ambil datanya' : 'Take the data'}
        </h3>
        <p className="mt-2 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Share-alike berarti basis data turunan ini bukan hanya diatribusikan, melainkan ditawarkan. Berikut berkas yang sama persis dengan yang dipakai merender halaman-halaman ini.'
            : 'Share-alike means this derived database is not merely attributed but offered. These are the same files these pages were rendered from.'}
        </p>
        <ul className="mt-2 list-none p-0 font-mono text-xs leading-relaxed">
          <li>
            <a href={manifestDataPath()} download>
              manifest.json
            </a>{' '}
            <span className="text-ink-subtle">
              {locale === 'id'
                ? '— parameter dan metrik seluruh lokasi, tanpa geometri'
                : '— parameters and metrics for every site, without the geometry'}
            </span>
          </li>
          {manifest.sites.map((site) => (
            <li key={site.slug}>
              <a href={siteDataPath(site.slug)} download>
                {site.slug}.json
              </a>{' '}
              <span className="text-ink-subtle">{site.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
