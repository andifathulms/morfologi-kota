/**
 * The maker's mark — a quiet author credit at the foot of every page.
 *
 * It shares the footer's one seam but not its job: the paragraphs beside it
 * are the legal layer — ODbL, the citation, the parameters — and this is a
 * signature, so the two sit as separate blocks under the same rule rather
 * than as one merged notice. Opposite ends of the bar on a wide screen,
 * stacked on a phone.
 *
 * Everything personal lives in the one structure below; changing a link or
 * the name never touches the markup.
 */

type MakerLink = {
  readonly label: string
  readonly href: string
  readonly icon: 'globe' | 'github' | 'linkedin' | 'instagram'
}

const MAKER = {
  name: 'Andi Fathul Mukminin',
  links: [
    { label: 'Portfolio', href: 'https://andifathulms.github.io/en/', icon: 'globe' },
    { label: 'GitHub', href: 'https://github.com/andifathulms', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/andifathulmukminin/', icon: 'linkedin' },
    { label: 'Instagram', href: 'https://www.instagram.com/andifathulms/', icon: 'instagram' },
  ],
} as const satisfies { name: string; links: readonly MakerLink[] }

/*
 * Glyphs, not logos: 18 px, currentColor, drawn inline so no request leaves
 * the browser and the icons take the ink the footer already has.
 */
function Icon({ icon }: { readonly icon: MakerLink['icon'] }) {
  const shared = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  } as const
  switch (icon) {
    case 'globe':
      return (
        <svg {...shared} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18" />
        </svg>
      )
    case 'github':
      return (
        <svg {...shared} fill="currentColor">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.69-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.06.78 2.14 0 1.54-.02 2.79-.02 3.17 0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...shared} fill="currentColor">
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...shared} fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="18" height="18" rx="4.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      )
    default: {
      const exhaustive: never = icon
      return exhaustive
    }
  }
}

export function MakerSignature() {
  // Resolved once at build time — the export is static, so the year is the
  // year the bundle was built, which is what a credit line means anyway.
  const year = new Date().getFullYear()
  const portfolio = MAKER.links[0]

  return (
    <div className="font-sans text-xs text-ink-subtle sm:text-right">
      <p className="m-0 leading-note">
        Designed &amp; built by{' '}
        <a
          href={portfolio.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-muted underline decoration-1 underline-offset-4 hover:decoration-drive"
        >
          {MAKER.name}
        </a>{' '}
        · © <span className="tabular font-mono">{year}</span>
      </p>
      {/* Icon links are pointers off the page; on paper they are dead ink. */}
      <ul data-print="hide" className="m-0 mt-2 flex list-none gap-1 p-0 sm:justify-end">
        {MAKER.links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="inline-flex rounded p-2 transition-colors duration-fast ease-house hover:bg-rule-faint hover:text-ink hover:no-underline"
            >
              <Icon icon={link.icon} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
