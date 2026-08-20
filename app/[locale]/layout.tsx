import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import '../globals.css'
import { LOCALES, d, isLocale, type Locale } from '@/lib/i18n'
import { loadManifest } from '@/lib/data'

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

export const metadata: Metadata = {
  title: 'Bentuk Kota — morfologi jaringan jalan',
  description:
    'Entropi orientasi jaringan jalan untuk sejumlah lokasi di Indonesia, dihitung terpisah untuk jaringan kendaraan dan jaringan pejalan kaki.',
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
        <div className="mx-auto max-w-plate px-4">
          <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule py-6">
            <div className="flex flex-wrap items-baseline gap-6">
              <Link href={`/${locale}/lempeng`} className="font-serif text-lg font-semibold no-underline">
                {d('siteTitle', locale)}
              </Link>
              <nav className="flex items-baseline gap-6 font-sans text-base">
                <Link href={`/${locale}/lempeng`}>{d('navPlate', locale)}</Link>
                <Link href={`/${locale}/asumsi`}>{d('navAssumptions', locale)}</Link>
                <Link href={`/${locale}/metode`}>{d('navMethod', locale)}</Link>
              </nav>
            </div>
            <Link href={`/${other}/lempeng`} className="font-mono text-xs uppercase tracking-wide">
              {other === 'en' ? 'English' : 'Bahasa Indonesia'}
            </Link>
          </header>

          <main className="py-8">{children}</main>

          {/*
            DESIGN.md §9 and PRD §7 — attribution is structural, not a footnote
            nobody reads. The radius, the bin count and the tag mapping are
            stated wherever a number is, and they are stated again here.
          */}
          <footer className="mt-16 border-t border-rule py-6 font-mono text-xs leading-relaxed">
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
