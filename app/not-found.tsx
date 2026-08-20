import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan — Bentuk Kota',
}

/**
 * The 404, written out rather than left to the framework's default.
 *
 * The root layout renders no document shell — that lives under `[locale]`, so
 * that `lang` is the language the page is actually in — which means this page
 * has to carry its own, and the audit caught that it was not. It is bilingual
 * because a reader arriving at a broken link has not chosen a language yet.
 */
export default function NotFound() {
  return (
    <html lang="id">
      <body
        style={{
          backgroundColor: '#FAF9F6',
          color: '#14140F',
          fontFamily: 'Georgia, serif',
          lineHeight: 1.55,
          margin: 0,
          padding: '32px',
        }}
      >
        <main>
          <h1 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>
            Halaman tidak ditemukan
          </h1>
          <p lang="en" style={{ fontSize: '18px' }}>
            Page not found.
          </p>
          <p style={{ fontSize: '18px' }}>
            <a href={`${basePath}/${DEFAULT_LOCALE}/lempeng/`}>
              Kembali ke lempeng — dua belas lokasi, dua jaringan
            </a>
          </p>
          <p lang="en" style={{ fontSize: '18px' }}>
            <a href={`${basePath}/en/lempeng/`}>Back to the plate</a>
          </p>
        </main>
      </body>
    </html>
  )
}
