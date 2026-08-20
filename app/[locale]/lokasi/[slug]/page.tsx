import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITES } from '@/data/sites'
import { loadBundle, loadManifest } from '@/lib/data'
import { PairView } from '@/components/pair/PairView'
import { CoverageBadge } from '@/components/metrics/CoverageBadge'
import { SITE_TYPE_LABEL, LOCALES, d, isLocale, t, type Locale } from '@/lib/i18n'
import { editorialFor } from '@/lib/editorial'
import { DEFAULT_TAG_MAPPING } from '@/lib/tags'
import { siteDataPath } from '@/lib/paths'

export function generateStaticParams(): { locale: Locale; slug: string }[] {
  return LOCALES.flatMap((locale) => SITES.map((site) => ({ locale, slug: site.slug })))
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string }
}): Metadata {
  const site = SITES.find((candidate) => candidate.slug === params.slug)
  if (site === undefined) return { title: 'Bentuk Kota' }
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const title = `${site.name}, ${site.city} — Bentuk Kota`
  const description =
    locale === 'id'
      ? `Jaringan kendaraan dan jaringan pejalan kaki di ${site.name}, ${site.city}, pada jari-jari sampel yang sama, beserta selisih di antara keduanya. ${t(site.note, 'id')}`
      : `The driving and the walking network at ${site.name}, ${site.city}, at the same sampling radius, with the gap between them. ${t(site.note, 'en')}`
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/lokasi/${site.slug}/`,
      languages: {
        id: `/id/lokasi/${site.slug}/`,
        en: `/en/lokasi/${site.slug}/`,
      },
    },
    openGraph: { type: 'article', title, description },
  }
}

/**
 * The pair (PRD §6.2) — two networks, two roses, two metric columns, and the
 * delta between them. The gap is the finding, rendered as a comparison rather
 * than described in a caption.
 */
export default function SitePage({ params }: { params: { locale: string; slug: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const site = SITES.find((candidate) => candidate.slug === params.slug)
  if (site === undefined) notFound()

  const bundle = loadBundle(site.slug)
  const manifest = loadManifest()
  const editorial = editorialFor(site.slug)
  const thin = bundle.coverage.confidence.type === 'thin'

  return (
    <article>
      <p className="m-0 font-sans text-xs">
        <Link href={`/${locale}/lempeng`}>{d('backToPlate', locale)}</Link>
      </p>

      <header className="mt-4 max-w-prose">
        <h1 className="m-0 font-serif text-2xl font-semibold leading-tight">{site.name}</h1>
        <p className="m-0 font-sans text-base text-ink/70">
          {site.city} · {t(SITE_TYPE_LABEL[site.type] ?? { id: site.type, en: site.type }, locale)}
        </p>
        <p className="mt-4 font-serif text-md leading-relaxed">{t(site.note, locale)}</p>
      </header>

      {/* DESIGN.md §9 — the legend contract: radius, mode and tag set, coverage. */}
      <div className="tabular my-6 border-y border-rule py-3 font-mono text-xs">
        <p className="m-0">
          {d('radius', locale)} {bundle.radiusM} m · 36 bin · {d('tagMapping', locale)} “
          {bundle.mappingId}” · {t(DEFAULT_TAG_MAPPING.note, locale)}
        </p>
        <div className="mt-1">
          <CoverageBadge coverage={bundle.coverage} locale={locale} verbose />
        </div>
      </div>

      {thin ? (
        <p className="mb-6 max-w-prose border-l-2 border-ink/40 pl-4 font-serif text-md leading-relaxed">
          {locale === 'id'
            ? 'Bacalah kedua kolom di bawah ini sebagai dua pembacaan dari data yang sama, bukan sebagai selisih yang sudah dapat disimpulkan. Gang di lokasi ini belum terpetakan cukup rapat untuk itu.'
            : 'Read the two columns below as two readings of the same data rather than as a gap that can yet be concluded from. The gang here are not mapped densely enough for that.'}
        </p>
      ) : null}

      <PairView bundle={bundle} locale={locale} />

      {editorial.length > 0 ? (
        <section className="mt-12 max-w-prose">
          <h2 className="m-0 font-serif text-lg font-semibold">
            {locale === 'id' ? 'Catatan' : 'Note'}
          </h2>
          {editorial.map((paragraph, index) => (
            <p key={index} className="mt-4 font-serif text-md leading-relaxed">
              {t(paragraph, locale)}
            </p>
          ))}
        </section>
      ) : null}

      {/* ODbL share-alike: the derived database is not only attributed, it is
          offered. The link is to the same bundle this page was rendered from. */}
      <p className="mt-12 max-w-prose font-mono text-xs leading-relaxed">
        <a href={siteDataPath(site.slug)} download>
          {d('downloadSite', locale)}
        </a>
      </p>
      <p className="tabular mt-2 max-w-prose font-mono text-xs leading-relaxed">
        {bundle.attribution} · {manifest.method.citation}
      </p>
    </article>
  )
}
