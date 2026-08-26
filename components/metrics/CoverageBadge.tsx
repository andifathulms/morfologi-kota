import type { Coverage } from '@/lib/morphology'
import { d, type Locale } from '@/lib/i18n'
import { percent } from '@/lib/format'

/**
 * Footway coverage confidence, printed on the card — not in a tooltip
 * (DESIGN.md §6, §9).
 *
 * The headline finding depends on gang being mapped. Where they are not, the
 * walking network collapses toward the driving network and the gap disappears
 * for the wrong reason, so a thin site is flagged rather than compared
 * (PRD §4).
 *
 * Flagging is typographic, not chromatic: there is no red in this product,
 * because nothing here is an error (DESIGN.md §3). A thin site takes the ink
 * rule the asides use for a caveat, so the flag reads at the distance a plate
 * is scanned from — sixteen cards of identical mono, and the one line that
 * bounds what the card can be read to mean set exactly like the rest of them.
 */
export function CoverageBadge({
  coverage,
  locale,
  verbose = false,
  metric,
}: {
  readonly coverage: Coverage
  readonly locale: Locale
  readonly verbose?: boolean
  /** The sort key this line is the value of, where the plate has one. */
  readonly metric?: string
}) {
  const label =
    coverage.confidence.type === 'thin'
      ? d('coverageThin', locale)
      : coverage.confidence.type === 'moderate'
        ? d('coverageModerate', locale)
        : d('coverageGood', locale)
  const thin = coverage.confidence.type === 'thin'

  return (
    <div className={thin ? 'border-l-2 border-ink pl-2 font-mono text-xs' : 'font-mono text-xs'}>
      <p data-metric={metric} className="tabular m-0">
        {thin ? <span aria-hidden="true">⚑ </span> : null}
        {d('coverage', locale)} {percent(coverage.pedestrianShare)} · {label}
      </p>
      {/* The sentence carries no rule of its own: the container carries one
          for every thin site, and two nested rules read as two levels of
          caveat where there is one. */}
      {thin && verbose ? (
        <p className="mt-1 max-w-prose font-sans text-base leading-note">
          {d('thinWarning', locale)}
        </p>
      ) : null}
    </div>
  )
}
