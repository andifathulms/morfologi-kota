import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadBundle, loadManifest } from '@/lib/data'
import { SiteCard } from '@/components/card/SiteCard'
import { PlateGrid, type SortOption, type SortableSite } from '@/components/plate/PlateGrid'
import { LOCALES, d, isLocale, type Locale } from '@/lib/i18n'
import { manifestDataPath } from '@/lib/paths'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  return {
    title:
      locale === 'id'
        ? 'Lempeng — dua belas lokasi, dua jaringan · Bentuk Kota'
        : 'The plate — twelve sites, two networks · Bentuk Kota',
    alternates: { canonical: `/${locale}/lempeng/` },
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

  return (
    <div>
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
        <p className="mt-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Setiap kartu memakai jari-jari sampel yang sama, mencetak jari-jari itu, dan melaporkan seberapa banyak gang yang sudah terpetakan di OpenStreetMap. Lokasi dapat diurutkan, tetapi tidak dinilai.'
            : 'Every card uses the same sampling radius, prints it, and reports how much of its gang network is mapped in OpenStreetMap. Sites can be sorted; they are not rated.'}
        </p>
        <p className="mt-4 max-w-prose border-l-2 border-ink/40 pl-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? `Yang ditemukan lebih dulu adalah temuan tentang datanya: ${thin} dari ${manifest.sites.length} lokasi memiliki cakupan gang yang tipis di OpenStreetMap. Untuk lokasi-lokasi itu, jaringan pejalan kakinya hampir sama dengan jaringan kendaraannya — bukan karena gangnya tidak ada, melainkan karena belum terpetakan. Selisih kendara/jalan kaki di sana tidak dapat dibaca sebagai temuan tentang tempatnya.`
            : `The first finding is a finding about the data: ${thin} of ${manifest.sites.length} sites have thin gang coverage in OpenStreetMap. For those, the walking network is nearly the driving network — not because the gang are not there, but because they are not mapped. The drive/walk gap at those sites cannot be read as a finding about the place.`}
        </p>
        <p className="tabular mt-4 font-mono text-xs">
          {manifest.sites.length} {locale === 'id' ? 'lokasi' : 'sites'} · r = {manifest.radiusM} m ·
          36 bin ·{' '}
          {locale === 'id'
            ? `${thin} bertanda cakupan gang tipis`
            : `${thin} flagged for thin footway coverage`}
        </p>
      </section>

      <PlateGrid
        sites={sites}
        options={options}
        locale={locale}
        sortLabel={d('sortBy', locale)}
        nameLabel={d('sortName', locale)}
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
