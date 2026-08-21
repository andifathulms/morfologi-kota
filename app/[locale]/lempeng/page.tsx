import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadBundle, loadManifest, loadReference } from '@/lib/data'
import Link from 'next/link'
import { SiteCard } from '@/components/card/SiteCard'
import { PlateGrid, type SortOption, type SortableSite } from '@/components/plate/PlateGrid'
import { alternatesFor, openGraphUrl } from '@/lib/metadata'
import { LOCALES, d, isLocale, type Locale } from '@/lib/i18n'
import { manifestDataPath } from '@/lib/paths'
import { SITE_TYPE_LABEL, t } from '@/lib/i18n'
import { fixed, kilometres, percent, signed, signedPercent } from '@/lib/format'
import { NetworkDrawing } from '@/components/network/NetworkDrawing'
import { ModeKey, ModeSwatch } from '@/components/legend/ModeKey'
import { ReferenceStrip } from '@/components/reference/ReferenceStrip'
import { Rose } from '@/components/rose/Rose'

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
 */
export default function PlatePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const manifest = loadManifest()
  const reference = loadReference()

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
  }))

  const options: SortOption[] = [
    { key: 'entropyDrive', label: `H — ${d('drive', locale)}`, descending: true },
    { key: 'entropyWalk', label: `H — ${d('walk', locale)}`, descending: true },
    { key: 'entropyDelta', label: `ΔH — ${d('walk', locale)} − ${d('drive', locale)}`, descending: true },
    { key: 'phiDrive', label: `φ — ${d('drive', locale)}`, descending: true },
    { key: 'circuityDrive', label: `${d('circuity', locale)} — ${d('drive', locale)}`, descending: true },
    { key: 'deadEndDrive', label: `${d('deadEnd', locale)} — ${d('drive', locale)}`, descending: true },
    { key: 'fourWayDrive', label: `${d('fourWay', locale)} — ${d('drive', locale)}`, descending: true },
    { key: 'densityDrive', label: `${d('intersectionDensity', locale)} — ${d('drive', locale)}`, descending: true },
    { key: 'lengthDelta', label: `Δ ${d('totalLength', locale)}`, descending: true },
    { key: 'coverage', label: d('coverage', locale), descending: true },
  ]

  const cards = manifest.sites.map((entry) => (
    <SiteCard
      key={entry.slug}
      entry={entry}
      geometry={loadBundle(entry.slug).drive.plateGeometry}
      locale={locale}
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

  const kampung = readable.filter((row) => row.site.type === 'kampung')
  const planned = readable.filter(
    (row) => row.site.type === 'perumahan' || row.site.type === 'kota-baru',
  )
  const range = (rows: typeof readable, pick: (row: (typeof readable)[number]) => number) => ({
    min: Math.min(...rows.map(pick)),
    max: Math.max(...rows.map(pick)),
  })

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

  return (
    <div>
      {/*
       * Reading order, deliberately.
       *
       * The claim, then the claim demonstrated, then the count, then the
       * caveat, then the numbers. It used to be claim, method, operational
       * detail, caveat, numbers, table — four hundred words and no drawing.
       * Nothing has been cut: the coverage caveat is still ahead of every
       * figure it qualifies, which is the only ordering PRD §4 permits.
       */}
      <section className="mb-12 max-w-prose">
        <h1 className="m-0 font-serif text-2xl font-semibold leading-tight">
          {locale === 'id'
            ? 'Lingkungan yang sama, dua kota berbeda'
            : 'The same neighbourhood, two different cities'}
        </h1>
        <p className="mt-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Entropi orientasi jaringan jalan menurut metode Boeing (2019), dihitung untuk dua jaringan yang berbeda di lokasi yang sama: jaringan yang dapat dikendarai, dan jaringan yang dapat dijalani kaki. Kampung terjalin rapat bagi pejalan kaki dan renggang bagi kendaraan; kluster berpagar kebalikannya. Metrik berbasis jaringan kendaraan tidak dapat melihat perbedaan itu.'
            : 'Street network orientation entropy after Boeing (2019), computed for two different networks in the same place: the one you can drive and the one you can walk. A kampung is densely connected on foot and barely by car; a gated cluster is the reverse. A driving-network metric cannot see the difference.'}
        </p>
      </section>

      {hero !== undefined ? (
        <section className="mb-12" aria-labelledby="contoh">
          {/*
            A label, not a heading. It introduces one figure rather than a
            section, and as an h2 it was a third visual treatment for a level
            the page already rendered two ways — 14px mono against 22px serif,
            same structural rank. The figure is titled by its caption, which is
            what figcaption is for; the section still takes its name from this
            text, so the region is announced either way.
          */}
          <p id="contoh" className="m-0 font-mono text-xs uppercase tracking-wide text-ink-subtle">
            {d('exampleHeading', locale)}
          </p>
          <figure className="m-0 mt-3">
            {/*
              Paired down to 640 px and stacked below it. Side by side is the
              comparison, so it is kept as far down as it stays legible — but
              on a 360 px phone two discs are 150 px each and the fine grain
              that is the whole point of the figure stops resolving.
            */}
            <div className="grid max-w-figure grid-cols-1 gap-6 sm:grid-cols-2">
              {(['drive', 'walk'] as const).map((mode) => (
                <div key={mode}>
                  <p className="m-0 mb-1 flex items-center gap-2 font-sans text-base font-semibold">
                    <ModeSwatch mode={mode} />
                    <span style={{ color: mode === 'drive' ? 'var(--drive)' : 'var(--walk)' }}>
                      {d(mode, locale)}
                    </span>
                  </p>
                  <NetworkDrawing
                    geometry={hero.bundle[mode].plateGeometry}
                    radiusM={hero.bundle.radiusM}
                    size={320}
                    responsive
                    label={`${hero.row.site.name} — ${d(mode, locale)}`}
                    instanceId="contoh"
                  />
                  <p className="tabular m-0 mt-1 font-mono text-xs">
                    {kilometres(hero.row.site[mode].totalLengthM)}
                  </p>
                </div>
              ))}
            </div>
            <figcaption className="mt-3 max-w-prose font-serif text-md leading-relaxed">
              {locale === 'id'
                ? `${hero.row.site.name}, ${hero.row.site.city}. Lingkaran yang sama, jari-jari ${hero.bundle.radiusM} m, ekstrak yang sama — ${kilometres(hero.row.site.drive.totalLengthM)} jalan bila Anda mengemudi, ${kilometres(hero.row.site.walk.totalLengthM)} bila Anda berjalan kaki. Selisih itulah yang diukur di sini, untuk setiap lokasi, dengan cara yang sama.`
                : `${hero.row.site.name}, ${hero.row.site.city}. The same disc, ${hero.bundle.radiusM} m radius, the same extract — ${kilometres(hero.row.site.drive.totalLengthM)} of street if you drive, ${kilometres(hero.row.site.walk.totalLengthM)} if you walk. That difference is what is measured here, for every site, the same way.`}{' '}
              <Link href={`/${locale}/lokasi/${hero.row.site.slug}`}>
                {d('openPair', locale)} — {hero.row.site.name}
              </Link>
            </figcaption>

            {/*
              The bridge.
              The example above explains the gap in kilometres, which is vivid
              and is not what this app measures with. Without this step a
              reader leaves understanding "walking has more street" — which
              they already suspected — and with no idea what the two coloured
              shapes on every card are for.
            */}
            <div className="mt-6 max-w-figure">
              <p className="m-0 max-w-prose font-serif text-md leading-relaxed">
                {d('heroBridge', locale)}
              </p>
              <div className="mt-4 flex flex-wrap items-start gap-6">
                <Rose
                  locale={locale}
                  size={200}
                  method={false}
                  series={[
                    {
                      shares: hero.bundle.drive.metrics.rose.shares,
                      kind: 'drive',
                      orientationEntropy: hero.bundle.drive.metrics.orientationEntropy,
                      orientationOrder: hero.bundle.drive.metrics.orientationOrder,
                    },
                    {
                      shares: hero.bundle.walk.metrics.rose.shares,
                      kind: 'walk',
                      orientationEntropy: hero.bundle.walk.metrics.orientationEntropy,
                      orientationOrder: hero.bundle.walk.metrics.orientationOrder,
                    },
                  ]}
                />
                <p className="tabular m-0 max-w-prose font-mono text-xs leading-relaxed">
                  {d('heroBridgeCompare', locale)}
                  <br />
                  {kilometres(hero.row.site.drive.totalLengthM)} →{' '}
                  {kilometres(hero.row.site.walk.totalLengthM)}
                  <br />H {fixed(hero.row.site.drive.orientationEntropy, 3)} →{' '}
                  {fixed(hero.row.site.walk.orientationEntropy, 3)}
                </p>
              </div>
            </div>
          </figure>
        </section>
      ) : null}

      <section className="mb-12 max-w-prose">
        <p className="tabular m-0 font-mono text-xs">
          {manifest.sites.length} {locale === 'id' ? 'lokasi' : 'sites'} · r = {manifest.radiusM} m ·
          36 bin ·{' '}
          {locale === 'id'
            ? `${thin} bertanda cakupan gang tipis`
            : `${thin} flagged for thin footway coverage`}
        </p>

        {/* The caveat keeps every word and keeps its place ahead of the
            numbers. What changes is that it now reads as a caveat, with a
            heading of its own, rather than as the third paragraph of the
            introduction. */}
        <aside className="mt-4 border-l-2 border-ink-subtle pl-4" aria-labelledby="peringatan">
          <h2 id="peringatan" className="m-0 font-serif text-lg font-semibold">
            {d('caveatHeading', locale)}
          </h2>
          <p className="mt-2 font-serif text-md leading-relaxed">
            {locale === 'id'
              ? `Yang ditemukan lebih dulu adalah temuan tentang datanya: ${thin} dari ${manifest.sites.length} lokasi memiliki cakupan gang yang tipis di OpenStreetMap. Untuk lokasi-lokasi itu, jaringan pejalan kakinya hampir sama dengan jaringan kendaraannya — bukan karena gangnya tidak ada, melainkan karena belum terpetakan. Selisih kendara/jalan kaki di sana tidak dapat dibaca sebagai temuan tentang tempatnya.`
              : `The first finding is a finding about the data: ${thin} of ${manifest.sites.length} sites have thin gang coverage in OpenStreetMap. For those, the walking network is nearly the driving network — not because the gang are not there, but because they are not mapped. The drive/walk gap at those sites cannot be read as a finding about the place.`}
          </p>
          <p className="mt-2 font-sans text-base leading-snug text-ink-muted">
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
      </section>

      {readable.length > 0 && kampung.length > 0 && planned.length > 0 ? (
        <section className="mb-12">
          <h2 className="m-0 max-w-prose font-serif text-lg font-semibold">
            {locale === 'id'
              ? `Selisihnya, pada ${readable.length} lokasi yang cakupannya memadai`
              : `The gap, at the ${readable.length} sites where coverage allows it`}
          </h2>
          <p className="mt-2 max-w-prose font-serif text-md leading-relaxed">
            {locale === 'id'
              ? `Di antara lokasi-lokasi ini, ${kampung.length} kampung memperoleh ${kilometres(range(kampung, (r) => r.extraLengthM).min)}–${kilometres(range(kampung, (r) => r.extraLengthM).max)} jaringan tambahan saat berjalan kaki, dan proporsi jalan buntunya turun ${percent(Math.abs(range(kampung, (r) => r.deadEndChange).max), 1)}–${percent(Math.abs(range(kampung, (r) => r.deadEndChange).min), 1)}. ${planned.length} lokasi terencana memperoleh ${kilometres(range(planned, (r) => r.extraLengthM).min)}–${kilometres(range(planned, (r) => r.extraLengthM).max)}, dengan proporsi jalan buntu bergerak ${signedPercent(range(planned, (r) => r.deadEndChange).min)} sampai ${signedPercent(range(planned, (r) => r.deadEndChange).max)}.`
              : `Among these, the ${kampung.length} kampung gain ${kilometres(range(kampung, (r) => r.extraLengthM).min)}–${kilometres(range(kampung, (r) => r.extraLengthM).max)} of network on foot, and their dead-end proportion falls by ${percent(Math.abs(range(kampung, (r) => r.deadEndChange).max), 1)}–${percent(Math.abs(range(kampung, (r) => r.deadEndChange).min), 1)}. The ${planned.length} planned sites gain ${kilometres(range(planned, (r) => r.extraLengthM).min)}–${kilometres(range(planned, (r) => r.extraLengthM).max)}, with their dead-end proportion moving ${signedPercent(range(planned, (r) => r.deadEndChange).min)} to ${signedPercent(range(planned, (r) => r.deadEndChange).max)}.`}
          </p>
          <p className="mt-2 max-w-prose font-serif text-md leading-relaxed">
            {locale === 'id'
              ? `Itu bunyi angkanya di ${readable.length} lokasi ini. Bukan pernyataan tentang bentuk kota Indonesia — untuk itu diperlukan cakupan gang yang jauh lebih luas daripada yang tersedia sekarang, terutama pada perumahan kluster, yang tidak satu pun kandidatnya lolos ambang.`
              : `That is what the numbers say at these ${readable.length} sites. It is not a statement about Indonesian urban form — that would need far wider gang coverage than currently exists, particularly for perumahan clusters, not one of which cleared the threshold.`}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="tabular w-full max-w-prose border-collapse font-mono text-xs">
              <caption className="sr-only">
                {locale === 'id'
                  ? 'Selisih jalan kaki dikurangi kendara pada lokasi dengan cakupan gang memadai, diurutkan menurut tambahan panjang jaringan.'
                  : 'Walk minus drive at the sites with adequate footway coverage, sorted by network length gained.'}
              </caption>
              <thead>
                <tr className="border-b border-rule-strong text-left">
                  <th scope="col" className="py-1 pr-4 font-normal">
                    {locale === 'id' ? 'Lokasi' : 'Site'}
                  </th>
                  <th scope="col" className="py-1 pr-4 font-normal">
                    {locale === 'id' ? 'Jenis' : 'Type'}
                  </th>
                  <th scope="col" className="py-1 pr-4 text-right font-normal">
                    {d('coverage', locale)}
                  </th>
                  <th scope="col" className="py-1 pr-4 text-right font-normal">
                    Δ {d('totalLength', locale)}
                  </th>
                  <th scope="col" className="py-1 pr-4 text-right font-normal">
                    Δ {d('deadEnd', locale)}
                  </th>
                  <th scope="col" className="py-1 pr-4 text-right font-normal">
                    Δ H
                  </th>
                </tr>
              </thead>
              <tbody>
                {readable.map((row) => (
                  <tr key={row.site.slug} className="border-b border-rule-faint">
                    <th scope="row" className="py-px pr-4 text-left font-normal">
                      <Link href={`/${locale}/lokasi/${row.site.slug}`}>{row.site.name}</Link>
                    </th>
                    <td className="py-px pr-4 text-ink-subtle">
                      {t(
                        SITE_TYPE_LABEL[row.site.type] ?? { id: row.site.type, en: row.site.type },
                        locale,
                      )}
                    </td>
                    <td className="py-px pr-4 text-right">
                      {percent(row.site.coverage.pedestrianShare)}
                    </td>
                    <td className="py-px pr-4 text-right">
                      {signed(row.extraLengthM / 1000, 1)} km
                    </td>
                    <td className="py-px pr-4 text-right">{signedPercent(row.deadEndChange)}</td>
                    <td className="py-px pr-4 text-right">{signed(row.entropyChange, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <ReferenceStrip reference={reference} locale={locale} />

      <div className="mt-12" />

      {/* The plate gets a heading of its own. It is the page's main content
          and it had none: the outline went from the introduction's last
          section directly to sixteen site names. */}
      <h2 className="m-0 font-serif text-lg font-semibold">
        {locale === 'id'
          ? `Lempeng — ${manifest.sites.length} lokasi, r = ${manifest.radiusM} m`
          : `The plate — ${manifest.sites.length} sites, r = ${manifest.radiusM} m`}
      </h2>

      <ModeKey locale={locale} className="mt-4 max-w-prose" />

      {/* Stated once for the whole plate rather than sixteen times on sixteen
          cards — but stated on the page where the roses are, not on /metode. */}
      <p className="mb-6 mt-3 max-w-prose font-sans text-base leading-snug text-ink-muted">
        {d('roseMethod', locale)} {d('roseSymmetryNote', locale)}{' '}
        <span className="font-mono text-xs">Boeing 2019 §3</span>
      </p>

      <PlateGrid
        sites={sites}
        options={options}
        locale={locale}
        sortLabel={d('sortBy', locale)}
        nameLabel={d('sortName', locale)}
        note={d('sortNotRanking', locale)}
      >
        {cards}
      </PlateGrid>

      <p className="mt-8 max-w-prose font-mono text-xs leading-relaxed">
        <a href={manifestDataPath()} download>
          {d('downloadManifest', locale)}
        </a>
      </p>
      <p className="tabular mt-2 max-w-prose font-mono text-xs leading-relaxed">
        {manifest.attribution} {d('offered', locale)}
      </p>
    </div>
  )
}
