import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const target = `${basePath}/${DEFAULT_LOCALE}/lempeng/`

export const metadata: Metadata = {
  title: 'Bentuk Kota',
  robots: { index: false },
}

/**
 * The root of the export. Indonesian is the default locale (PRD front matter),
 * so this hands over to it — by meta refresh, so it works with JavaScript off
 * and makes no network request beyond the navigation itself.
 */
export default function RootPage() {
  return (
    <html lang="id">
      <head>
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
      </head>
      <body
        style={{
          backgroundColor: '#F7F4EC',
          color: '#16140F',
          fontFamily: 'Georgia, serif',
          lineHeight: 1.55,
          margin: 0,
          padding: '32px',
        }}
      >
        {/* A handoff page is still a page: it gets a landmark and a heading, so
            that a reader who lands here with the refresh disabled is not
            dropped into an unstructured document. */}
        <main>
          <h1 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>Bentuk Kota</h1>
          <p style={{ fontSize: '18px' }}>
            <a href={target}>Lempeng morfologi jaringan jalan — dua jaringan untuk tempat yang sama</a>
          </p>
          <p lang="en" style={{ fontSize: '18px' }}>
            <a href={`${basePath}/en/lempeng/`}>Street network morphology — the plate, in English</a>
          </p>
        </main>
      </body>
    </html>
  )
}
