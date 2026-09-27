import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadManifest } from '@/lib/data'
import { alternatesFor, openGraphUrl } from '@/lib/metadata'
import { LOCALES, SITE_TYPE_LABEL, d, isLocale, t, type Locale } from '@/lib/i18n'
import { ISLAND_LABEL, ISLAND_ORDER, islandGroup } from '@/lib/islands'
import { Rose } from '@/components/rose/Rose'
import { percent, signed } from '@/lib/format'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const count = loadManifest().sites.length
  return {
    title:
      locale === 'id' ? `Lokasi — ${count} cakram · Bentuk Kota` : `Sites — ${count} discs · Bentuk Kota`,
    alternates: alternatesFor(locale, 'lokasi'),
    openGraph: { url: openGraphUrl(locale, 'lokasi') },
  }
}

/* The frame the centres are plotted in: the archipelago, in degrees. */
const LON_MIN = 94.5
const LON_MAX = 141.5
const LAT_MAX = 3
const LAT_MIN = -11
const WIDTH = 1000
const HEIGHT = 280

/**
 * The index — a way to find a site (DESIGN.md §6d).
 *
 * The plate is for comparing and the pair for reading one place closely;
 * neither is a way to *find* one. A reader who wanted Palu had to scroll a
 * grid of thirty-three or guess a URL. This lists the set by where each site
 * is, which is a fact about location and never a classification of form —
 * the grouping tints nothing and orders nothing but the alphabet.
 *
 * The figure at the top is the centres plotted by longitude and latitude,
 * with no basemap: the archipelago appears from the points alone, which is
 * both the honest drawing for a product with no mapping library and a
 * reminder of how unevenly the set covers the country. Thin-coverage sites
 * are hollow, as they are in the gap figure.
 *
 * Each tile carries the site's overlaid rose, and the rose carries its H and
 * φ, because a rose without its numbers is a shape (Invariants §12).
 */
export default function SitesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const manifest = loadManifest()

  const sites = [...manifest.sites].sort((a, b) => a.name.localeCompare(b.name, locale))
  const groups = ISLAND_ORDER.map((group) => ({
    group,
    sites: sites.filter((site) => islandGroup(site.centreLatDeg, site.centreLonDeg) === group),
  })).filter((entry) => entry.sites.length > 0)
  const cities = new Set(manifest.sites.map((site) => site.city)).size

  const x = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH
  const y = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HEIGHT

  return (
    <div>
      <h1 className="m-0 font-serif text-3xl font-medium leading-none tracking-display md:text-4xl">
        {locale === 'id' ? 'Lokasi' : 'Sites'}
      </h1>
      <p className="mt-6 max-w-prose font-serif text-md leading-prose text-ink-muted">
        {locale === 'id'
          ? `${manifest.sites.length} cakram berjari-jari ${manifest.radiusM} m di ${cities} kota, dipilih menurut kelengkapan data di OpenStreetMap — bukan menurut metriknya, karena memilih lokasi menurut entropinya sama dengan memilih temuannya lebih dulu. Ini bukan sampel bentuk kota Indonesia.`
          : `${manifest.sites.length} discs of ${manifest.radiusM} m radius in ${cities} cities, chosen for the completeness of their OpenStreetMap data — never for their metrics, because choosing sites by their entropy would be choosing the finding in advance. This is not a sample of Indonesian urban form.`}
      </p>

      <figure className="m-0 mt-8 border border-rule-faint bg-sheet p-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={
            locale === 'id'
              ? `Pusat ${manifest.sites.length} lokasi menurut bujur dan lintang, tanpa peta dasar.`
              : `The centres of ${manifest.sites.length} sites by longitude and latitude, with no basemap.`
          }
        >
          {[0, -5, -10].map((lat) => (
            <g key={lat}>
              <line
                x1={0}
                x2={WIDTH}
                y1={y(lat)}
                y2={y(lat)}
                stroke="var(--rule)"
                strokeWidth={0.75}
                strokeDasharray="2 5"
              />
              <text x={WIDTH - 4} y={y(lat) - 5} textAnchor="end" fontSize={12} fill="var(--ink-subtle)" className="font-mono">
                {lat === 0 ? '0°' : `${Math.abs(lat)}° ${locale === 'id' ? 'LS' : 'S'}`}
              </text>
            </g>
          ))}
          {groups.map(({ group, sites: members }) => {
            const lon = members.reduce((sum, site) => sum + site.centreLonDeg, 0) / members.length
            const meanLat = members.reduce((sum, site) => sum + site.centreLatDeg, 0) / members.length
            /* Java and Bali sit along the bottom of the frame and against
               each other, so their labels go under their points; the rest
               go above. */
            const below = meanLat < -6
            const labelY = below
              ? y(Math.min(...members.map((site) => site.centreLatDeg))) + 26
              : y(Math.max(...members.map((site) => site.centreLatDeg))) - 14
            /* Anchored toward the middle near either edge, so a label at
               the far east or west of the archipelago is not clipped. */
            const anchor = x(lon) > WIDTH * 0.85 ? 'end' : x(lon) < WIDTH * 0.15 ? 'start' : 'middle'
            return (
              <text
                key={group}
                x={anchor === 'end' ? x(lon) + 6 : anchor === 'start' ? x(lon) - 6 : x(lon)}
                y={labelY}
                textAnchor={anchor}
                fontSize={13}
                fill="var(--ink-subtle)"
                /* A halo in the sheet's colour, so a latitude line or a
                   neighbouring point never runs through the text. */
                stroke="var(--sheet)"
                strokeWidth={5}
                strokeLinejoin="round"
                paintOrder="stroke"
                className="font-sans"
              >
                {t(ISLAND_LABEL[group], locale)} · {members.length}
              </text>
            )
          })}
          {manifest.sites.map((site) => {
            const thin = site.coverage.confidence.type === 'thin'
            return (
              <circle
                key={site.slug}
                cx={x(site.centreLonDeg)}
                cy={y(site.centreLatDeg)}
                r={5}
                fill={thin ? 'var(--sheet)' : 'var(--ink)'}
                stroke="var(--ink)"
                strokeWidth={1.25}
              >
                {/* One string: inside SVG, React's separators between text
                    children do not survive parsing, and hydration fails. */}
                <title>{`${site.name}, ${site.city}`}</title>
              </circle>
            )
          })}
        </svg>
        <figcaption className="mt-2 font-sans text-xs text-ink-subtle">
          {locale === 'id'
            ? 'Titik pusat menurut bujur dan lintang, tanpa peta dasar. Titik berongga: cakupan gang tipis.'
            : 'Centres by longitude and latitude, with no basemap. Hollow: thin footway coverage.'}
        </figcaption>
      </figure>

      {groups.map(({ group, sites: members }) => (
        <section
          key={group}
          className="mt-12 border-t-2 border-ink pt-4 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8"
          aria-labelledby={`pulau-${group}`}
        >
          <div>
            <h2 id={`pulau-${group}`} className="m-0 font-serif text-xl font-medium tracking-heading">
              {t(ISLAND_LABEL[group], locale)}
            </h2>
            <p className="tabular m-0 mt-1 font-mono text-xs text-ink-subtle">
              {members.length} {locale === 'id' ? 'lokasi' : members.length === 1 ? 'site' : 'sites'}
            </p>
          </div>
          <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-x-6 gap-y-8 p-0 sm:grid-cols-2 lg:mt-0 xl:grid-cols-3">
            {members.map((site) => {
              const thin = site.coverage.confidence.type === 'thin'
              return (
                <li key={site.slug} className="border-t border-rule-strong pt-3">
                  <h3 className="m-0 font-serif text-lg font-medium leading-tight tracking-heading">
                    <Link href={`/${locale}/lokasi/${site.slug}`} className="no-underline">
                      {site.name}
                    </Link>
                  </h3>
                  <p className="m-0 mt-1 font-sans text-xs text-ink-subtle">
                    {site.city} · {t(SITE_TYPE_LABEL[site.type] ?? { id: site.type, en: site.type }, locale)}
                  </p>
                  <div className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4">
                    <Rose
                      locale={locale}
                      size={112}
                      animate={false}
                      caption={false}
                      method={false}
                      series={[
                        {
                          shares: site.drive.rose.shares,
                          kind: 'drive',
                          orientationEntropy: site.drive.orientationEntropy,
                          orientationOrder: site.drive.orientationOrder,
                        },
                        {
                          shares: site.walk.rose.shares,
                          kind: 'walk',
                          orientationEntropy: site.walk.orientationEntropy,
                          orientationOrder: site.walk.orientationOrder,
                        },
                      ]}
                    />
                    {/* The rose's H and φ, set beside it rather than under it
                        (Invariants §12), with the coverage line and the gap. */}
                    <dl className="tabular m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
                      <dt className="font-sans text-ink-subtle">{d('drive', locale)}</dt>
                      <dd className="m-0">
                        H {site.drive.orientationEntropy.toFixed(3)} · φ {site.drive.orientationOrder.toFixed(2)}
                      </dd>
                      <dt className="font-sans text-ink-subtle">{d('walk', locale)}</dt>
                      <dd className="m-0">
                        H {site.walk.orientationEntropy.toFixed(3)} · φ {site.walk.orientationOrder.toFixed(2)}
                      </dd>
                      <dt className="font-sans text-ink-subtle">{d('delta', locale)}</dt>
                      <dd className="m-0">
                        {signed((site.walk.totalLengthM - site.drive.totalLengthM) / 1000, 1)} km
                      </dd>
                      <dt className="font-sans text-ink-subtle">{locale === 'id' ? 'Gang' : 'Footway'}</dt>
                      <dd className={thin ? 'm-0 font-semibold' : 'm-0'}>
                        {thin ? <span aria-hidden="true">⚑ </span> : null}
                        {percent(site.coverage.pedestrianShare)} ·{' '}
                        {thin
                          ? d('coverageThin', locale)
                          : site.coverage.confidence.type === 'moderate'
                            ? d('coverageModerate', locale)
                            : d('coverageGood', locale)}
                      </dd>
                    </dl>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <p className="tabular mt-16 max-w-prose font-mono text-xs leading-prose">
        r = {manifest.radiusM} m · 36 bin · {manifest.attribution}
      </p>
    </div>
  )
}
