import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const target = `${basePath}/${DEFAULT_LOCALE}/lempeng/`

export const metadata: Metadata = {
  title: 'Bentuk Kota',
  robots: { index: false },
}

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
      <body style={shell.body}>
        {/* A handoff page is still a page: it gets a landmark and a heading, so
            that a reader who lands here with the refresh disabled is not
            dropped into an unstructured document. */}
        <main style={shell.main}>
          <h1 style={shell.h1}>Bentuk Kota</h1>
          <p style={shell.p}>
            <a href={target}>Lempeng morfologi jaringan jalan — dua jaringan untuk tempat yang sama</a>
          </p>
          <p lang="en" style={shell.p}>
            <a href={`${basePath}/en/lempeng/`}>Street network morphology — the plate, in English</a>
          </p>
        </main>
      </body>
    </html>
  )
}
