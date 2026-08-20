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
 * because nothing here is an error (DESIGN.md §3).
 */
export function CoverageBadge({
  coverage,
  locale,
  verbose = false,
}: {
  readonly coverage: Coverage
  readonly locale: Locale
  readonly verbose?: boolean
}) {
  const label =
    coverage.confidence.type === 'thin'
      ? d('coverageThin', locale)
      : coverage.confidence.type === 'moderate'
        ? d('coverageModerate', locale)
        : d('coverageGood', locale)
  const thin = coverage.confidence.type === 'thin'

  return (
    <div className="font-mono text-xs">
      <p className="tabular m-0">
        {thin ? <span aria-hidden="true">⚑ </span> : null}
        {d('coverage', locale)} {percent(coverage.pedestrianShare)} · {label}
      </p>
      {thin && verbose ? (
        <p className="mt-1 max-w-prose border-l-2 border-ink/30 pl-2 font-sans text-xs leading-snug">
          {d('thinWarning', locale)}
        </p>
      ) : null}
    </div>
  )
}
