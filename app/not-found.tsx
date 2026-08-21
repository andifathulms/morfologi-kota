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
const shell: Record<string, React.CSSProperties> = {
  /*
   * The house, inline.
   *
   * Neither of these pages imports `globals.css` — the root layout renders no
   * document shell, so a page outside `[locale]` has to carry its own — and
   * both of them had drifted to a 28 px heading on default measure. A reader
   * arriving on a broken link met a page that did not look like this project.
   *
   * Georgia is not a substitute for Source Serif here; it is the same fallback
   * `tailwind.config.ts` declares for `--font-serif`, and no webfont is loaded
   * on a page whose whole job is to hand over to another one. What is matched
   * is the scale and the ground: plate, ink, h1 at 36, body at 18, one measure
   * (DESIGN.md §3, §7).
   */
  body: {
    backgroundColor: '#F7F4EC',
    color: '#16140F',
    colorScheme: 'light',
    fontFamily: 'Georgia, serif',
    lineHeight: 1.55,
    margin: 0,
    padding: '32px',
  },
  main: { maxWidth: '68ch' },
  h1: { fontSize: '36px', fontWeight: 600, lineHeight: 1.15, margin: 0 },
  p: { fontSize: '18px', lineHeight: 1.5 },
}

export default function NotFound() {
  return (
    <html lang="id">
      <body style={shell.body}>
        <main style={shell.main}>
          <h1 style={shell.h1}>Halaman tidak ditemukan</h1>
          <p lang="en" style={shell.p}>
            Page not found.
          </p>
          <p style={shell.p}>
            <a href={`${basePath}/${DEFAULT_LOCALE}/lempeng/`}>
              Kembali ke lempeng morfologi jaringan jalan
            </a>
          </p>
          <p lang="en" style={shell.p}>
            <a href={`${basePath}/en/lempeng/`}>Back to the plate</a>
          </p>
        </main>
      </body>
    </html>
  )
}
