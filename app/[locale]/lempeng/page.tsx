import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadBundle, loadManifest } from '@/lib/data'
import Link from 'next/link'
import { SiteCard } from '@/components/card/SiteCard'
import { PlateGrid, type SortOption, type SortableSite } from '@/components/plate/PlateGrid'
import { PlateHero } from '@/components/plate/PlateHero'
import { GapFigure } from '@/components/plate/GapFigure'
import { alternatesFor, openGraphUrl } from '@/lib/metadata'
import { LOCALES, d, isLocale, type Locale } from '@/lib/i18n'
import { manifestDataPath } from '@/lib/paths'
import { ModeSwatch } from '@/components/legend/ModeKey'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  // Counted, not written down: the set grows when a surveyed candidate is
  // adopted, and a title that says twelve when there are sixteen is the kind
  // of thing nobody notices until it is in a search result.
  const count = loadManifest().sites.length
  return {
    title:
      locale === 'id'
        ? `Lempeng — ${count} lokasi, dua jaringan · Bentuk Kota`
        : `The plate — ${count} sites, two networks · Bentuk Kota`,
    alternates: alternatesFor(locale, 'lempeng'),
    openGraph: { url: openGraphUrl(locale, 'lempeng') },
  }
}

/**
 * The plate (PRD §6.1) — one card per site, the whole set visible at once.
 *
 * Sortable by any metric, because that is what small multiples are for: a
 * pattern across the set appears by re-sorting. Sorting is not ranking, and
 * the page says so.
 *
 * ## Reading order, after the 2026 pass
 *
 * The claim demonstrated, the caveat, the gap at every site, then the cards.
 * The page used to put about 3,700 px of argument, calibration and legend
 * ahead of the first card; the argument's findings are now the gap figure,
 * and the calibration networks, the legend and the method notes moved to
 * Metode › Cara membaca, linked from the toolbar. The coverage caveat did not
 * move: it is still ahead of every figure it qualifies (PRD §4).
 */
export default function PlatePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const manifest = loadManifest()

  const sites: SortableSite[] = manifest.sites.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    values: {
      entropyDrive: entry.drive.orientationEntropy,
      entropyWalk: entry.walk.orientationEntropy,
      entropyDelta: entry.walk.orientationEntropy - entry.drive.orientationEntropy,
      phiDrive: entry.drive.orientationOrder,
      circuityDrive: entry.drive.sampledCircuity,
      deadEndDrive: entry.drive.degrees.proportions.deadEnd,
      fourWayDrive: entry.drive.degrees.proportions.fourWay,
      densityDrive: entry.drive.intersectionDensityPerKm2,
      lengthDelta: entry.walk.totalLengthM - entry.drive.totalLengthM,
      coverage: entry.coverage.pedestrianShare,
    },
    thin: entry.coverage.confidence.type === 'thin',
  }))

  /*
   * Grouped by the question the sort answers, not by the order they were
   * written in (DESIGN.md §6). `identity` is what the site is and is not a
   * measurement; `mode` is a figure for one network; `gap` is the difference
   * between the two, which is the product's subject — and coverage belongs
   * there, because it is the thing that decides whether a gap can be read at
   * all.
   *
   * The mode suffix stays on every chip in the per-mode group, verbose as it
   * is. φ for the driving network and φ for the walking network are different
   * numbers, and a legend reading `Per moda` above a chip reading `φ` does not
   * say which one is being sorted by — precision is worth ten repetitions of
   * one word.
   */
  const options: SortOption[] = [
    { key: 'entropyDrive', label: `H — ${d('drive', locale)}`, descending: true, group: 'mode' },
    { key: 'entropyWalk', label: `H — ${d('walk', locale)}`, descending: true, group: 'mode' },
    { key: 'phiDrive', label: `φ — ${d('drive', locale)}`, descending: true, group: 'mode' },
    {
      key: 'circuityDrive',
      label: `${d('circuity', locale)} — ${d('drive', locale)}`,
      descending: true,
      group: 'mode',
    },
    {
      key: 'deadEndDrive',
      label: `${d('deadEnd', locale)} — ${d('drive', locale)}`,
      descending: true,
      group: 'mode',
    },
    {
      key: 'fourWayDrive',
      label: `${d('fourWay', locale)} — ${d('drive', locale)}`,
      descending: true,
      group: 'mode',
    },
    {
      key: 'densityDrive',
      label: `${d('intersectionDensity', locale)} — ${d('drive', locale)}`,
      descending: true,
      group: 'mode',
    },
    {
      key: 'entropyDelta',
      label: `ΔH — ${d('walk', locale)} − ${d('drive', locale)}`,
      descending: true,
      group: 'gap',
    },
    { key: 'lengthDelta', label: `Δ ${d('totalLength', locale)}`, descending: true, group: 'gap' },
    { key: 'coverage', label: d('coverage', locale), descending: true, group: 'gap' },
  ]

  /*
   * The scale every card's H is read against (DESIGN.md §6a).
   *
   * One axis for both modes and for every card: the extremes of the set in
   * either mode. Computed here rather than in the card, because a card cannot
   * see the set it belongs to and a ruler drawn against sixteen different
   * ranges would position nothing.
   */
  const entropyValues = manifest.sites.flatMap((entry) => [
    entry.drive.orientationEntropy,
    entry.walk.orientationEntropy,
  ])
  const entropyScale = {
    drive: manifest.sites.map((entry) => ({
      slug: entry.slug,
      value: entry.drive.orientationEntropy,
    })),
    walk: manifest.sites.map((entry) => ({
      slug: entry.slug,
      value: entry.walk.orientationEntropy,
    })),
    min: Math.min(...entropyValues),
    max: Math.max(...entropyValues),
  }

  const cards = manifest.sites.map((entry) => (
    <SiteCard
      key={entry.slug}
      entry={entry}
      geometry={loadBundle(entry.slug).drive.plateGeometry}
      locale={locale}
      entropyScale={entropyScale}
    />
  ))

  const thin = manifest.sites.filter((site) => site.coverage.confidence.type === 'thin').length

  /*
   * The subset where the comparison is actually readable.
   *
   * Everything below is computed from the manifest rather than written down,
   * so a re-survey or a new site moves the sentence with it. Ordered by how
   * much walking network the site has over its driving network — a sort, not a
   * rating (PRD §4): being higher in this list is not being better.
   */
  const readable = manifest.sites
    .filter((site) => site.coverage.confidence.type !== 'thin')
    .map((site) => ({
      site,
      extraLengthM: site.walk.totalLengthM - site.drive.totalLengthM,
      deadEndChange: site.walk.degrees.proportions.deadEnd - site.drive.degrees.proportions.deadEnd,
      entropyChange: site.walk.orientationEntropy - site.drive.orientationEntropy,
    }))
    .sort((a, b) => b.extraLengthM - a.extraLengthM)

  /*
   * The set outgrew two groups.
   *
   * The paragraph below used to name kampung and planned sites and stop, which
   * was a complete account of the readable set when the readable set was
   * kampung and planned sites. It is not any more: the small towns are two of
   * the ten sites whose coverage allows the comparison at all, and a summary
   * that counts ten and describes eight leaves a reader to wonder which two
   * were left out and why.
   */
  /*
   * Counted, never written down.
   *
   * The closing sentence used to state as fact that no perumahan candidate had
   * ever cleared the threshold. It was true when it was written and false the
   * moment Cipayung was adopted — and it stayed on the page directly above a
   * table whose first row contradicted it. A claim about the data belongs in
   * an expression that reads the data.
   */
  const gatedTotal = manifest.sites.filter((site) => site.type === 'perumahan').length
  const gatedReadable = readable.filter((row) => row.site.type === 'perumahan')

  /*
   * The worked example.
   *
   * A stranger used to meet four hundred words before the first drawing, which
   * is a long way to ask someone to read on trust that two networks differ.
   * One site, both networks, at the top — the claim demonstrated before it is
   * explained.
   *
   * Chosen, not written down: the largest walk-over-drive gain among the sites
   * whose coverage allows the comparison at all, preferring a kampung because
   * that is where the gap is the premise rather than an artefact. Selection is
   * on coverage and on network length — never on entropy, which would be
   * choosing the finding in advance (PRD §4).
   */
  const heroRow = readable.find((row) => row.site.type === 'kampung') ?? readable[0]
  const hero =
    heroRow === undefined
      ? undefined
      : { row: heroRow, bundle: loadBundle(heroRow.site.slug) }

  /*
   * The sentence that bounds the gap figure. Counted, never written down: it
   * used to state as fact that no perumahan candidate had ever cleared the
   * threshold, and stayed on the page above a table whose first row
   * contradicted it.
   */
  const closing =
    locale === 'id'
      ? `Itu bunyi angkanya di ${readable.length} lokasi yang cakupannya memadai. Bukan pernyataan tentang bentuk kota Indonesia — untuk itu diperlukan cakupan gang yang jauh lebih luas daripada yang tersedia sekarang. ${gatedReadable.length === 0 ? 'Perumahan kluster masih menjadi lubang terbesar: tidak satu pun kandidatnya lolos ambang.' : `Perumahan kluster masih menjadi bagian paling tipis: ${gatedReadable.length} dari ${gatedTotal} lokasi berpagar dalam kumpulan ini yang cakupannya memadai.`}`
      : `That is what the numbers say at the ${readable.length} sites with adequate coverage. It is not a statement about Indonesian urban form — that would need far wider gang coverage than currently exists. ${gatedReadable.length === 0 ? 'Gated perumahan remains the largest hole: not one candidate cleared the threshold.' : `Gated perumahan remains the thinnest part of it: ${gatedReadable.length} of the ${gatedTotal} gated sites in this set have adequate coverage.`}`

  return (
    <div>
      {hero !== undefined ? (
        <PlateHero
          entry={hero.row.site}
          bundle={hero.bundle}
          locale={locale}
          count={manifest.sites.length}
        />
      ) : null}

      {/* The caveat, ahead of every figure it qualifies (PRD §4). Set at the
          size of the argument it is, not as a parameter. */}
      <aside
        className="mb-16 max-w-figure border-l-2 border-ink bg-sheet px-6 py-4"
        aria-labelledby="peringatan"
      >
        <h2 id="peringatan" className="m-0 font-serif text-lg font-medium tracking-heading">
          <span aria-hidden="true">⚑ </span>
          {d('caveatHeading', locale)}
        </h2>
        <p className="mt-2 font-serif text-md leading-prose">
          {locale === 'id'
            ? `Yang ditemukan lebih dulu adalah temuan tentang datanya: ${thin} dari ${manifest.sites.length} lokasi memiliki cakupan gang yang tipis di OpenStreetMap. Untuk lokasi-lokasi itu, jaringan pejalan kakinya hampir sama dengan jaringan kendaraannya — bukan karena gangnya tidak ada, melainkan karena belum terpetakan. Selisih kendara/jalan kaki di sana tidak dapat dibaca sebagai temuan tentang tempatnya.`
            : `The first finding is a finding about the data: ${thin} of ${manifest.sites.length} sites have thin gang coverage in OpenStreetMap. For those, the walking network is nearly the driving network — not because the gang are not there, but because they are not mapped. The drive/walk gap at those sites cannot be read as a finding about the place.`}
        </p>
        <p className="mt-2 font-sans text-base leading-note text-ink-muted">
          {locale === 'id'
            ? 'Setiap kartu memakai jari-jari sampel yang sama, mencetak jari-jari itu, dan melaporkan seberapa banyak gang yang sudah terpetakan di OpenStreetMap. Lokasi dapat diurutkan, tetapi tidak dinilai.'
            : 'Every card uses the same sampling radius, prints it, and reports how much of its gang network is mapped in OpenStreetMap. Sites can be sorted; they are not rated.'}{' '}
          <Link href={`/${locale}/metode#pemilihan`}>
            {locale === 'id'
              ? 'Kandidat yang diukur dan tidak diadopsi tercatat pada halaman metode.'
              : 'The candidates that were measured and not adopted are recorded on the method page.'}
          </Link>
        </p>
      </aside>

      <GapFigure entries={manifest.sites} locale={locale} closing={closing} />

      {/* The plate gets a heading of its own. It is the page's main content. */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h2 id="lempeng" className="m-0 font-serif text-xl font-medium tracking-heading">
          {locale === 'id'
            ? `Lempeng — ${manifest.sites.length} lokasi, r = ${manifest.radiusM} m`
            : `The plate — ${manifest.sites.length} sites, r = ${manifest.radiusM} m`}
        </h2>
        {/* The key, in one line; the full legend is on the method page. */}
        <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <ModeSwatch mode="drive" /> {d('drive', locale)}
          </span>
          <span className="inline-flex items-center gap-2">
            <ModeSwatch mode="walk" /> {d('walk', locale)}
          </span>
          <span className="inline-flex items-center gap-2">
            <ModeSwatch mode="both" /> {d('keyBoth', locale)}
          </span>
          <span className="tabular font-mono">36 bin</span>
        </p>
      </div>

      {/*
        The caveat, restated where the numbers are, for a reader who arrived
        by a shared sort link (DESIGN.md §6). One sentence now: the full
        statement is two screens up rather than four.
      */}
      {thin > 0 ? (
        <p className="mb-6 max-w-prose border-l-2 border-ink pl-4 font-serif text-md leading-prose">
          {locale === 'id'
            ? `${thin} dari ${manifest.sites.length} lokasi di bawah bertanda cakupan gang tipis; selisihnya bukan temuan tentang tempatnya. `
            : `${thin} of the ${manifest.sites.length} sites below are flagged for thin footway coverage; the gap there is not a finding about the place. `}
          <Link href={`/${locale}/lempeng#peringatan`}>
            {locale === 'id' ? 'Selengkapnya di atas.' : 'Stated in full above.'}
          </Link>
        </p>
      ) : null}

      <PlateGrid
        sites={sites}
        options={options}
        locale={locale}
        sortLabel={d('sortBy', locale)}
        nameLabel={d('sortName', locale)}
        note={d('sortNotRanking', locale)}
        readingLink={{
          href: `/${locale}/metode#cara-membaca`,
          label: locale === 'id' ? 'Cara membaca lempeng' : 'How to read the plate',
        }}
        sheetLegend={
          locale === 'id'
            ? `Lembar kontak — jaringan kendara, ${manifest.sites.length} lokasi, r = ${manifest.radiusM} m, tinta seragam. Jari-jari sama untuk seluruh set, jadi dicetak sekali di sini dan bukan pada tiap cakram.`
            : `Contact sheet — the driving network, ${manifest.sites.length} sites, r = ${manifest.radiusM} m, uniform ink. The radius is the same across the set, so it is printed once here rather than on every disc.`
        }
      >
        {cards}
      </PlateGrid>

      <p className="mt-12 max-w-prose font-mono text-xs leading-prose">
        <a href={manifestDataPath()} download>
          {d('downloadManifest', locale)}
        </a>
      </p>
      <p className="tabular mt-2 max-w-prose font-mono text-xs leading-prose">
        {manifest.attribution} {d('offered', locale)}
      </p>
    </div>
  )
}
