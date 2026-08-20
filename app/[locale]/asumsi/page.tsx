import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { loadBundle, loadManifest } from '@/lib/data'
import { LOCALES, d, isLocale, t, type Locale } from '@/lib/i18n'
import { TAG_MAPPINGS, DEFAULT_TAG_MAPPING } from '@/lib/tags'
import { MAPPING_EXEMPLAR_SLUGS, ROBUST_THRESHOLD, SENSITIVE_THRESHOLD } from '@/data/sites'
import { NetworkDrawing } from '@/components/network/NetworkDrawing'
import { fixed, kilometres, percent, signed } from '@/lib/format'

/**
 * Metric labels for the stability summary. Kept beside the table rather than
 * in the dictionary because they are the emitted field names, and a reader
 * comparing the page against the downloaded JSON should see the same keys.
 */
const METRIC_LABEL: Record<string, { id: string; en: string }> = {
  orientationEntropy: { id: 'Entropi orientasi — H', en: 'Orientation entropy — H' },
  orientationOrder: { id: 'φ keteraturan', en: 'φ orientation-order' },
  sampledCircuity: { id: 'Circuity', en: 'Circuity' },
  averageDegree: { id: 'Derajat simpul rata-rata', en: 'Average node degree' },
  fourWayProportion: { id: 'Proporsi simpang empat', en: 'Four-way proportion' },
  deadEndProportion: { id: 'Proporsi jalan buntu', en: 'Dead-end proportion' },
  intersectionDensityPerKm2: { id: 'Kerapatan simpang', en: 'Intersection density' },
  medianSegmentLengthM: { id: 'Panjang ruas median', en: 'Median segment length' },
  totalLengthM: { id: 'Panjang jaringan', en: 'Network length' },
}

const STABILITY_LABEL: Record<string, { id: string; en: string }> = {
  robust: { id: 'tahan', en: 'robust' },
  moderate: { id: 'sedang', en: 'moderate' },
  sensitive: { id: 'peka', en: 'sensitive' },
}

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  return {
    title: locale === 'id' ? 'Asumsi — pemetaan tag dan cakupan gang · Bentuk Kota' : 'Assumptions — tag mapping and footway coverage · Bentuk Kota',
    alternates: { canonical: `/${locale}/asumsi/` },
  }
}

/**
 * Assumptions (PRD §6.5, §6.6).
 *
 * Tag interpretation is a modelling choice, not a fact: which OSM highway
 * values count as drivable and which as walkable changes every number in the
 * product. So the mapping is shown, the alternatives are shown, and the effect
 * of switching between them is shown — the assumption is a control, not a
 * constant.
 *
 * All three mappings are computed by the pipeline, so switching between them
 * here reads precomputed numbers rather than recomputing in the browser. That
 * is what keeps the runtime free of both a graph library and a network
 * request.
 */
export default function AssumptionsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const manifest = loadManifest()
  const bundles = manifest.sites.map((entry) => loadBundle(entry.slug))

  /*
   * The headline reading of the sensitivity summary, derived here rather than
   * written down: a metric is called robust only if it stays robust under
   * every mapping that touches it, and sensitive if any mapping makes it so.
   * Hard-coding this sentence would mean it could silently go stale the first
   * time a tag set changed.
   */
  const touchedEntries = manifest.sensitivitySummary.filter((entry) => entry.maxAbsoluteChange > 0)
  const metricKeys = [...new Set(touchedEntries.map((entry) => entry.metric))]
  const robust = metricKeys.filter((metric) =>
    touchedEntries
      .filter((entry) => entry.metric === metric)
      .every((entry) => entry.stability === 'robust'),
  )
  const sensitive = metricKeys.filter((metric) =>
    touchedEntries.some((entry) => entry.metric === metric && entry.stability === 'sensitive'),
  )
  const middling = metricKeys.filter(
    (metric) => !robust.includes(metric) && !sensitive.includes(metric),
  )
  const label = (metric: string) => t(METRIC_LABEL[metric] ?? { id: metric, en: metric }, locale)

  const rules = TAG_MAPPINGS.map(
    (mapping) =>
      `#map-${mapping.id}:checked~.mappings [data-mapping="${mapping.id}"]{display:block}` +
      `#map-${mapping.id}:checked~.mappings label[for="map-${mapping.id}"]{background:var(--ink);color:var(--plate)}` +
      `#map-${mapping.id}:focus-visible~.mappings label[for="map-${mapping.id}"]{outline:3px solid var(--ink);outline-offset:2px}`,
  ).join('')

  return (
    <div>
      <section className="max-w-prose">
        <h1 className="m-0 font-serif text-2xl font-semibold leading-tight">
          {locale === 'id' ? 'Asumsi' : 'Assumptions'}
        </h1>
        <p className="mt-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Nilai tag mana yang dihitung sebagai dapat dikendarai dan mana yang dapat dijalani kaki adalah pilihan pemodelan, bukan fakta. Pilihan itu mengubah setiap angka dalam produk ini, jadi ia ditampilkan sebagai kendali — bukan disembunyikan sebagai konstanta.'
            : 'Which tag values count as drivable and which as walkable is a modelling choice, not a fact. It changes every number in this product, so it is exposed as a control rather than buried as a constant.'}
        </p>
        <p className="mt-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Ketiga pemetaan di bawah ini dihitung penuh oleh pipeline saat build. Beralih di antaranya menampilkan angka yang sudah dihitung, bukan menghitung ulang di peramban — halaman ini tidak melakukan permintaan jaringan apa pun.'
            : 'All three mappings below are computed in full by the pipeline at build time. Switching between them shows numbers that already exist rather than recomputing in the browser — this page makes no network request at all.'}
        </p>
      </section>

      <section className="mt-12 max-w-prose">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Apa yang bertahan, apa yang tidak' : 'What survives, and what does not'}
        </h2>
        <p className="mt-2 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Kesimpulan dari tabel-tabel di bawah, dihitung bukan dikira-kira. '
            : 'The conclusion from the tables below, computed rather than guessed. '}
          <strong className="font-semibold">
            {locale === 'id'
              ? `Bertahan: ${robust.map(label).join(', ')}.`
              : `Robust: ${robust.map(label).join(', ')}.`}
          </strong>{' '}
          {middling.length > 0
            ? locale === 'id'
              ? `Sedang: ${middling.map(label).join(', ')}. `
              : `Moderate: ${middling.map(label).join(', ')}. `
            : null}
          {sensitive.length > 0
            ? locale === 'id'
              ? `Peka: ${sensitive.map(label).join(', ')} — angka-angka itu hanya berarti bila disebutkan bersama pemetaannya, dan tidak boleh dibandingkan dengan angka dari kajian yang memakai pemetaan lain.`
              : `Sensitive: ${sensitive.map(label).join(', ')} — those only mean anything stated together with their mapping, and must not be compared against figures from a study that used a different one.`
            : null}
        </p>
        <p className="mt-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Polanya masuk akal. Ukuran yang menjawab “ke arah mana jalan membentang” bertahan, karena menambah atau membuang satu kelas jalan jarang mengubah arah keseluruhan. Ukuran yang menjawab “berapa banyak jalan yang ada” tidak bertahan, karena itu persis yang diubah oleh keputusan pemetaan. φ jatuh di antara keduanya: ia dihitung dari entropi, tetapi kuadrat dalam rumusnya melipatgandakan gerakan kecil.'
            : 'The pattern makes sense. Measures that answer “which way do the streets run” survive, because adding or removing a class rarely changes the overall directions. Measures that answer “how much street is there” do not, because that is exactly what the mapping decision changes. φ falls between the two: it is derived from entropy, but the square in its formula amplifies a small movement.'}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="m-0 mb-4 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Pemetaan tag' : 'The tag mapping'}
        </h2>
        <style dangerouslySetInnerHTML={{ __html: rules }} />
        {TAG_MAPPINGS.map((mapping) => (
          <input
            key={mapping.id}
            type="radio"
            name="mapping"
            id={`map-${mapping.id}`}
            defaultChecked={mapping.id === DEFAULT_TAG_MAPPING.id}
            className="sr-only"
          />
        ))}

        <div className="mappings">
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 p-0 font-sans text-base text-ink-subtle">
              {d('tagMapping', locale)}
            </legend>
            <div className="flex flex-wrap gap-2">
              {TAG_MAPPINGS.map((mapping) => (
                <label
                  key={mapping.id}
                  htmlFor={`map-${mapping.id}`}
                  className="cursor-pointer border border-rule-strong px-2 py-1 font-mono text-xs transition-colors duration-fast ease-house"
                >
                  {t(mapping.label, locale)}
                </label>
              ))}
            </div>
          </fieldset>

          {TAG_MAPPINGS.map((mapping) => (
            <div key={mapping.id} data-mapping={mapping.id} className="mt-6 hidden">
              <p className="m-0 max-w-prose font-serif text-md leading-relaxed">
                {t(mapping.note, locale)}
              </p>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="m-0 font-sans text-base font-semibold" style={{ color: 'var(--drive)' }}>
                    {d('drive', locale)} — highway
                  </h3>
                  <p className="m-0 font-mono text-xs leading-relaxed">
                    {mapping.drivable.join(' · ')}
                  </p>
                </div>
                <div>
                  <h3 className="m-0 font-sans text-base font-semibold" style={{ color: 'var(--walk)' }}>
                    {d('walk', locale)} — highway
                  </h3>
                  <p className="m-0 font-mono text-xs leading-relaxed">
                    {mapping.walkable.join(' · ')}
                  </p>
                </div>
              </div>

              {(() => {
                const summary = manifest.sensitivitySummary.filter(
                  (entry) => entry.mappingId === mapping.id,
                )
                if (summary.length === 0) {
                  return (
                    <p className="mt-8 max-w-prose font-serif text-md leading-relaxed">
                      {locale === 'id'
                        ? 'Ini pemetaan baku — dasar pembanding bagi kedua pemetaan lainnya. Setiap angka yang tampil di kartu dan di halaman pasangan dihitung dengan pemetaan ini.'
                        : 'This is the default mapping — the baseline the other two are compared against. Every number shown on a card and on a pair page is computed with it.'}
                    </p>
                  )
                }
                const touched = (['drive', 'walk'] as const).filter((mode) =>
                  summary.some((entry) => entry.mode === mode && entry.maxAbsoluteChange > 0),
                )
                const untouched = (['drive', 'walk'] as const).filter(
                  (mode) => !touched.includes(mode),
                )
                return (
                  <>
                    <h3 className="mt-8 font-serif text-lg font-semibold">
                      {locale === 'id'
                        ? 'Metrik mana yang bertahan terhadap pemetaan ini'
                        : 'Which metrics survive this mapping'}
                    </h3>
                    <p className="mt-2 max-w-prose font-serif text-md leading-relaxed">
                      {locale === 'id'
                        ? `Perubahan relatif rata-rata terhadap pemetaan baku, di seluruh ${manifest.sites.length} lokasi. Di bawah ${percent(ROBUST_THRESHOLD, 0)} disebut tahan: angkanya dapat dibandingkan antar-lokasi tanpa perlu tahu pemetaannya. Di atas ${percent(SENSITIVE_THRESHOLD, 0)} disebut peka: angkanya hanya berarti bila disebutkan bersama pemetaan yang menghasilkannya.`
                        : `Mean relative change against the default mapping, across all ${manifest.sites.length} sites. Below ${percent(ROBUST_THRESHOLD, 0)} is called robust: the number can be compared across sites without knowing the mapping. Above ${percent(SENSITIVE_THRESHOLD, 0)} is called sensitive: it only means anything stated together with the mapping that produced it.`}
                    </p>
                    {untouched.length > 0 ? (
                      <p className="mt-2 max-w-prose font-mono text-xs leading-relaxed">
                        {locale === 'id'
                          ? `Jaringan ${untouched.map((mode) => d(mode === 'drive' ? 'drive' : 'walk', locale).toLowerCase()).join(' dan ')} tidak tersentuh sama sekali oleh pemetaan ini — nol perubahan di setiap lokasi, yang memang seharusnya.`
                          : `The ${untouched.map((mode) => d(mode === 'drive' ? 'drive' : 'walk', locale).toLowerCase()).join(' and ')} network is untouched by this mapping — zero change at every site, which is what it should be.`}
                      </p>
                    ) : null}
                    <div className="mt-4 overflow-x-auto">
                      <table className="tabular w-full border-collapse font-mono text-xs">
                        <caption className="sr-only">
                          {locale === 'id'
                            ? `Kepekaan tiap metrik terhadap pemetaan ${mapping.id}.`
                            : `Each metric's sensitivity to the ${mapping.id} mapping.`}
                        </caption>
                        <thead>
                          <tr className="border-b border-rule-strong text-left">
                            <th scope="col" className="py-1 pr-4 font-normal">
                              {locale === 'id' ? 'Metrik' : 'Metric'}
                            </th>
                            <th scope="col" className="py-1 pr-4 font-normal">
                              {locale === 'id' ? 'Jaringan' : 'Network'}
                            </th>
                            <th scope="col" className="py-1 pr-4 text-right font-normal">
                              {locale === 'id' ? 'Perubahan rata-rata' : 'Mean change'}
                            </th>
                            <th scope="col" className="py-1 pr-4 font-normal">
                              {locale === 'id' ? 'Ketahanan' : 'Stability'}
                            </th>
                            <th scope="col" className="py-1 pr-4 font-normal">
                              {locale === 'id' ? 'Bergerak paling jauh' : 'Moves most'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary
                            .filter((entry) => touched.includes(entry.mode))
                            .map((entry) => (
                              <tr
                                key={`${entry.metric}-${entry.mode}`}
                                className="border-b border-rule-faint"
                              >
                                <th scope="row" className="py-px pr-4 text-left font-normal">
                                  {t(
                                    METRIC_LABEL[entry.metric] ?? {
                                      id: entry.metric,
                                      en: entry.metric,
                                    },
                                    locale,
                                  )}
                                </th>
                                <td
                                  className="py-px pr-4"
                                  style={{
                                    color:
                                      entry.mode === 'drive' ? 'var(--drive)' : 'var(--walk)',
                                  }}
                                >
                                  {d(entry.mode === 'drive' ? 'drive' : 'walk', locale)}
                                </td>
                                <td className="py-px pr-4 text-right">
                                  {percent(entry.meanRelativeChange, 1)}
                                </td>
                                <td className="py-px pr-4">
                                  {entry.stability === 'sensitive' ? '⚑ ' : ''}
                                  {t(
                                    STABILITY_LABEL[entry.stability] ?? {
                                      id: entry.stability,
                                      en: entry.stability,
                                    },
                                    locale,
                                  )}
                                </td>
                                <td className="py-px pr-4 text-ink-subtle">
                                  {entry.worstSlug === '' ? '—' : entry.worstSlug}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              })()}

              <h3 className="mt-8 font-serif text-lg font-semibold">
                {locale === 'id' ? 'Angka di bawah pemetaan ini' : 'The numbers under this mapping'}
              </h3>
              <p className="m-0 max-w-prose font-sans text-base text-ink-subtle">
                {locale === 'id'
                  ? 'Selisih dihitung terhadap pemetaan baku. Angkanya memang bergerak; itulah maksudnya.'
                  : 'Differences are against the default mapping. The numbers do move; that is the point.'}
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="tabular w-full border-collapse font-mono text-xs">
                  <caption className="sr-only">
                    {locale === 'id'
                      ? `Angka setiap lokasi di bawah pemetaan ${mapping.id}, dengan selisih terhadap pemetaan baku.`
                      : `Every site's numbers under the ${mapping.id} mapping, with differences against the default.`}
                  </caption>
                  <thead>
                    <tr className="border-b border-rule-strong text-left">
                      <th scope="col" className="py-1 pr-4 font-normal">
                        {locale === 'id' ? 'Lokasi' : 'Site'}
                      </th>
                      <th scope="col" className="py-1 pr-4 text-right font-normal">
                        H {d('drive', locale)}
                      </th>
                      <th scope="col" className="py-1 pr-4 text-right font-normal">
                        Δ
                      </th>
                      <th scope="col" className="py-1 pr-4 text-right font-normal">
                        H {d('walk', locale)}
                      </th>
                      <th scope="col" className="py-1 pr-4 text-right font-normal">
                        Δ
                      </th>
                      <th scope="col" className="py-1 pr-4 text-right font-normal">
                        {d('deadEnd', locale)} {d('drive', locale)}
                      </th>
                      <th scope="col" className="py-1 pr-4 text-right font-normal">
                        {d('totalLength', locale)} {d('walk', locale)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.map((bundle) => {
                      const here = bundle.sensitivity.find((s) => s.mappingId === mapping.id)
                      const base = bundle.sensitivity.find(
                        (s) => s.mappingId === DEFAULT_TAG_MAPPING.id,
                      )
                      if (here === undefined || base === undefined) return null
                      return (
                        <tr key={bundle.site.slug} className="border-b border-rule-faint">
                          <th scope="row" className="py-px pr-4 text-left font-normal">
                            <Link href={`/${locale}/lokasi/${bundle.site.slug}`}>
                              {bundle.site.name}
                            </Link>
                          </th>
                          <td className="py-px pr-4 text-right">
                            {fixed(here.drive.orientationEntropy, 3)}
                          </td>
                          <td className="py-px pr-4 text-right text-ink-subtle">
                            {signed(here.drive.orientationEntropy - base.drive.orientationEntropy, 3)}
                          </td>
                          <td className="py-px pr-4 text-right">
                            {fixed(here.walk.orientationEntropy, 3)}
                          </td>
                          <td className="py-px pr-4 text-right text-ink-subtle">
                            {signed(here.walk.orientationEntropy - base.walk.orientationEntropy, 3)}
                          </td>
                          <td className="py-px pr-4 text-right">
                            {percent(here.drive.deadEndProportion)}
                          </td>
                          <td className="py-px pr-4 text-right">
                            {kilometres(here.walk.totalLengthM)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/*
        The mapping, drawn.
        PRD §6.5 makes the tag mapping a control, and every other part of this
        page argues that in numbers — which is the least persuasive register
        available for "this is a choice, not a fact". These are the lines
        leaving.
      */}
      <section className="mt-16">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {d('mappingDrawingHeading', locale)}
        </h2>
        <p className="mt-2 max-w-prose font-serif text-md leading-relaxed">
          {d('mappingDrawingNote', locale)}
        </p>

        {MAPPING_EXEMPLAR_SLUGS.map((slug) => {
          const bundle = loadBundle(slug)
          const alternates = bundle.alternateGeometry ?? []
          if (alternates.length === 0) return null
          return (
            <figure key={slug} className="m-0 mt-8">
              <figcaption className="m-0 font-sans text-base font-semibold">
                {bundle.site.name}
                <span className="ml-2 font-normal text-ink-subtle">
                  {bundle.site.city} · r = {bundle.radiusM} m
                </span>
              </figcaption>
              {(['drive', 'walk'] as const).map((mode) => (
                <div key={mode} className="mt-4">
                  <p
                    className="m-0 font-sans text-base font-semibold"
                    style={{ color: mode === 'drive' ? 'var(--drive)' : 'var(--walk)' }}
                  >
                    {d(mode, locale)}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3">
                    {alternates.map((alternate) => {
                      const mapping = TAG_MAPPINGS.find((m) => m.id === alternate.mappingId)
                      const geometry =
                        mode === 'drive' ? alternate.drivePlateGeometry : alternate.walkPlateGeometry
                      const lengthM =
                        mode === 'drive' ? alternate.driveTotalLengthM : alternate.walkTotalLengthM
                      return (
                        <div key={alternate.mappingId}>
                          <NetworkDrawing
                            geometry={geometry}
                            radiusM={bundle.radiusM}
                            size={240}
                            responsive
                            animate={false}
                            mode={mode}
                            label={`${bundle.site.name} — ${d(mode, locale)} — ${alternate.mappingId}`}
                            instanceId={`map-${alternate.mappingId}`}
                          />
                          <p className="tabular m-0 mt-1 font-mono text-xs">
                            {mapping === undefined ? alternate.mappingId : t(mapping.label, locale)}
                            {alternate.mappingId === DEFAULT_TAG_MAPPING.id ? ' ·' : ' ·'}{' '}
                            {kilometres(lengthM)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </figure>
          )
        })}
      </section>

      <section className="mt-16">
        <h2 className="m-0 font-serif text-lg font-semibold">
          {locale === 'id' ? 'Cakupan gang per lokasi' : 'Footway coverage per site'}
        </h2>
        <p className="mt-2 max-w-prose font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Temuan utama bergantung pada gang yang sudah terpetakan. Kalau gang sebuah kampung tidak ada di OpenStreetMap, jaringan pejalan kakinya akan menciut mendekati jaringan kendaraannya dan selisihnya hilang — bukan karena tidak ada, melainkan karena belum ada yang memetakannya. Ini ukuran tentang datanya, bukan tentang tempatnya.'
            : 'The headline finding depends on gang being mapped. If a kampung’s alleys are absent from OpenStreetMap its walking network collapses toward its driving network and the gap disappears — not because it is not there, but because nobody mapped it. This is a measure of the data, not of the place.'}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="tabular w-full border-collapse font-mono text-xs">
            <caption className="sr-only">
              {locale === 'id'
                ? 'Cakupan gang per lokasi, dengan keyakinan dan kerapatannya.'
                : 'Footway coverage per site, with its confidence and density.'}
            </caption>
            <thead>
              <tr className="border-b border-rule-strong text-left">
                <th scope="col" className="py-1 pr-4 font-normal">
                  {locale === 'id' ? 'Lokasi' : 'Site'}
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-normal">
                  {d('coverage', locale)}
                </th>
                <th scope="col" className="py-1 pr-4 font-normal">
                  {locale === 'id' ? 'Keyakinan' : 'Confidence'}
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-normal">
                  m/km²
                </th>
              </tr>
            </thead>
            <tbody>
              {manifest.sites.map((entry) => (
                <tr key={entry.slug} className="border-b border-rule-faint">
                  <th scope="row" className="py-px pr-4 text-left font-normal">
                    <Link href={`/${locale}/lokasi/${entry.slug}`}>{entry.name}</Link>
                  </th>
                  <td className="py-px pr-4 text-right">{percent(entry.coverage.pedestrianShare)}</td>
                  <td className="py-px pr-4">
                    {entry.coverage.confidence.type === 'thin' ? '⚑ ' : ''}
                    {entry.coverage.confidence.type === 'thin'
                      ? d('coverageThin', locale)
                      : entry.coverage.confidence.type === 'moderate'
                        ? d('coverageModerate', locale)
                        : d('coverageGood', locale)}
                  </td>
                  <td className="py-px pr-4 text-right">
                    {entry.coverage.pedestrianDensityMPerKm2.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
