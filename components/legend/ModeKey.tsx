import { d, type Locale } from '@/lib/i18n'
import type { Mode } from '@/lib/tags'

/** The two inks, and what they make where they overlap. */
export type Swatch = Mode | 'both'

/**
 * The key for the two hues.
 *
 * `--drive` and `--walk` are the only hues in the product (DESIGN.md §3), and
 * on the plate they appeared only inside the rose — a reader met two coloured
 * shapes with no statement anywhere of what either colour meant. The hues also
 * sit at 1.4:1 to each other, so they were never separable by luminance.
 *
 * So the key names them in words, and the swatch repeats the same distinction
 * the rose draws: drive is a solid fill, walk is an outline. That survives
 * greyscale, print, and a reader who does not separate the two hues.
 */
export function ModeSwatch({ mode }: { readonly mode: Swatch }) {
  if (mode === 'both') {
    /* Drawn as the two inks actually overlap: one square over the other,
       multiplying. The colour is produced here too, not painted from the
       token — the token exists for the fallback path. */
    return (
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="shrink-0"
        style={{ isolation: 'isolate' }}
      >
        <rect x={1} y={1} width={14} height={14} fill="var(--drive)" className="rose-ink" />
        <rect
          x={1.75}
          y={1.75}
          width={12.5}
          height={12.5}
          fill="var(--walk)"
          fillOpacity={0.18}
          stroke="var(--walk)"
          strokeWidth={2.5}
          className="rose-ink"
        />
      </svg>
    )
  }
  const hue = mode === 'drive' ? 'var(--drive)' : 'var(--walk)'
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      {mode === 'drive' ? (
        <rect x={1} y={1} width={14} height={14} fill={hue} fillOpacity={0.85} />
      ) : (
        <rect
          x={1.75}
          y={1.75}
          width={12.5}
          height={12.5}
          fill={hue}
          fillOpacity={0.18}
          stroke={hue}
          strokeWidth={2.5}
        />
      )}
    </svg>
  )
}

export function ModeKey({ locale, className }: { readonly locale: Locale; readonly className?: string }) {
  const rows: readonly { mode: Swatch; term: string; gloss: string }[] = [
    { mode: 'drive', term: d('drive', locale), gloss: d('keyDrive', locale) },
    { mode: 'walk', term: d('walk', locale), gloss: d('keyWalk', locale) },
    { mode: 'both', term: d('keyBoth', locale), gloss: d('keyBothGloss', locale) },
  ]

  return (
    <div className={className}>
      <p className="m-0 font-sans text-base font-semibold">{d('keyHeading', locale)}</p>
      <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
        {rows.map((row) => (
          <div key={row.mode} className="contents">
            <dt className="flex items-center gap-2 font-sans text-base font-semibold">
              <ModeSwatch mode={row.mode} />
              <span
                style={
                  row.mode === 'both'
                    ? { color: 'var(--overprint)' }
                    : { color: row.mode === 'drive' ? 'var(--drive)' : 'var(--walk)' }
                }
              >
                {row.term}
              </span>
            </dt>
            <dd className="m-0 font-sans text-base leading-snug text-ink-muted">{row.gloss}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
