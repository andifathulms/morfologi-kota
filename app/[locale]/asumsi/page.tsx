import { notFound } from 'next/navigation'
import Link from 'next/link'
import { loadBundle, loadManifest } from '@/lib/data'
import { LOCALES, d, isLocale, t, type Locale } from '@/lib/i18n'
import { TAG_MAPPINGS, DEFAULT_TAG_MAPPING } from '@/lib/tags'
import { fixed, kilometres, percent, signed } from '@/lib/format'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
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
            <legend className="mb-2 p-0 font-sans text-base text-ink/70">
              {d('tagMapping', locale)}
            </legend>
            <div className="flex flex-wrap gap-2">
              {TAG_MAPPINGS.map((mapping) => (
                <label
                  key={mapping.id}
                  htmlFor={`map-${mapping.id}`}
                  className="cursor-pointer border border-rule px-2 py-1 font-mono text-xs transition-colors duration-fast ease-house"
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

              <h3 className="mt-8 font-serif text-lg font-semibold">
                {locale === 'id' ? 'Angka di bawah pemetaan ini' : 'The numbers under this mapping'}
              </h3>
              <p className="m-0 max-w-prose font-sans text-xs text-ink/70">
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
                    <tr className="border-b border-rule text-left">
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
                        <tr key={bundle.site.slug} className="border-b border-rule/40">
                          <th scope="row" className="py-px pr-4 text-left font-normal">
                            <Link href={`/${locale}/lokasi/${bundle.site.slug}`}>
                              {bundle.site.name}
                            </Link>
                          </th>
                          <td className="py-px pr-4 text-right">
                            {fixed(here.drive.orientationEntropy, 3)}
                          </td>
                          <td className="py-px pr-4 text-right text-ink/60">
                            {signed(here.drive.orientationEntropy - base.drive.orientationEntropy, 3)}
                          </td>
                          <td className="py-px pr-4 text-right">
                            {fixed(here.walk.orientationEntropy, 3)}
                          </td>
                          <td className="py-px pr-4 text-right text-ink/60">
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
              <tr className="border-b border-rule text-left">
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
                <tr key={entry.slug} className="border-b border-rule/40">
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
