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
      <body style={{ backgroundColor: '#FAF9F6', color: '#14140F', fontFamily: 'Georgia, serif', padding: '32px' }}>
        <p>
          <a href={target}>Bentuk Kota — lempeng morfologi jalan</a>
        </p>
      </body>
    </html>
  )
}
