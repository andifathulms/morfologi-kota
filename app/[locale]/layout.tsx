import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import '../globals.css'
import { LOCALES, d, isLocale, type Locale } from '@/lib/i18n'
import { loadManifest } from '@/lib/data'
import { NavLink } from '@/components/nav/NavLink'

/*
 * DESIGN.md §7. Self-hosted: next/font fetches at build time and serves the
 * files from the export, so no request leaves the browser at runtime.
 */
const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-serif',
  display: 'swap',
})

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * Sharing metadata.
 *
 * `metadataBase` is only set when the deploy URL is supplied, because a guessed
 * origin produces canonical links that point at a site that does not exist —
 * worse than having none. Set NEXT_PUBLIC_SITE_URL in the workflow to turn the
 * absolute URLs on.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const title =
    locale === 'id'
      ? 'Bentuk Kota — morfologi jaringan jalan'
      : 'Bentuk Kota — street network morphology'
  const description =
    locale === 'id'
      ? 'Entropi orientasi jaringan jalan untuk sejumlah lokasi di Indonesia, dihitung terpisah untuk jaringan kendaraan dan jaringan pejalan kaki. Menjelaskan bentuk kota, tidak menilainya.'
      : 'Street network orientation entropy for a set of Indonesian sites, computed separately for the driving and the walking network. It describes urban form; it does not rate it.'

  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title,
    description,
    alternates: {
      canonical: `/${locale}/lempeng/`,
      languages: { id: '/id/lempeng/', en: '/en/lempeng/' },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      locale: locale === 'id' ? 'id_ID' : 'en_GB',
      alternateLocale: locale === 'id' ? 'en_GB' : 'id_ID',
    },
    // No preview image: generating one would mean a rendering dependency for a
    // picture of a figure the page already draws.
    twitter: { card: 'summary', title, description },
  }
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const manifest = loadManifest()
  const other: Locale = locale === 'id' ? 'en' : 'id'

  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-plate text-ink font-serif text-base">
        {/* First stop for a keyboard: past the navigation, into the figure. */}
        <a
          href="#utama"
          data-print="hide"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:border focus:border-ink focus:bg-plate focus:px-4 focus:py-2 focus:font-sans"
        >
          {locale === 'id' ? 'Langsung ke isi' : 'Skip to content'}
        </a>
        <div className="mx-auto max-w-plate px-4">
          {/*
            The masthead carries the standing one-line description, not just
            the name. A reader landing on any page — the plate, a pair, the
            assumptions — should be told in one sentence what this measures
            before they meet a metric. It was written and unused until now.
          */}
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule-strong py-6">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <Link
                  href={`/${locale}/lempeng`}
                  className="font-serif text-xl font-semibold leading-tight no-underline"
                >
                  {d('siteTitle', locale)}
                </Link>
                <p className="m-0 mt-1 max-w-prose font-sans text-xs leading-snug text-ink-subtle">
                  {d('tagline', locale)}
                </p>
              </div>
              <nav
                aria-label={locale === 'id' ? 'Bagian utama' : 'Sections'}
                className="flex items-baseline gap-6 font-sans text-base"
              >
                <NavLink href={`/${locale}/lempeng`}>{d('navPlate', locale)}</NavLink>
                <NavLink href={`/${locale}/asumsi`}>{d('navAssumptions', locale)}</NavLink>
                <NavLink href={`/${locale}/metode`}>{d('navMethod', locale)}</NavLink>
              </nav>
            </div>
            <Link
              href={`/${other}/lempeng`}
              lang={other}
              hrefLang={other}
              data-print="hide"
              className="font-mono text-xs uppercase tracking-wide"
            >
              {other === 'en' ? 'English' : 'Bahasa Indonesia'}
            </Link>
          </header>

          <main id="utama" className="py-8">
            {children}
          </main>

          {/*
            DESIGN.md §9 and PRD §7 — attribution is structural, not a footnote
            nobody reads. The radius, the bin count and the tag mapping are
            stated wherever a number is, and they are stated again here.
          */}
          <footer
            className="mt-16 border-t border-rule-strong py-6 font-mono text-xs leading-relaxed"
            aria-label={locale === 'id' ? 'Sumber data dan parameter' : 'Data source and parameters'}
          >
            <p>{manifest.attribution}</p>
            <p>
              {manifest.method.citation} DOI {manifest.method.doi}
            </p>
            <p>
              r = {manifest.radiusM} m · {manifest.binCount} bin · mapping “{manifest.mappingId}” ·
              extract {manifest.extractVersion}
            </p>
            <p className="mt-2">{d('describesNotScores', locale)}</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
