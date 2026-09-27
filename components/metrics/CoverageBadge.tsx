import { GOOD_COVERAGE_THRESHOLD, THIN_COVERAGE_THRESHOLD, type Coverage } from '@/lib/morphology'
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

/** The meter's full width. Every site in the set sits below it. */
const METER_MAX = 0.5

/**
 * Coverage, drawn as well as stated — the plate card's form of the badge.
 *
 * A bar from 0 to 50% with the two thresholds marked where they are, so a
 * reader sees how far a site is from being flagged rather than only which
 * side of the line it fell on. It describes the *data*, not the place: a long
 * bar means the gang are mapped, not that the neighbourhood is good
 * (PRD §4). Ink on the sunk ground, no hue and no ramp (DESIGN.md §3).
 *
 * The thresholds are read from `lib/morphology`, so the marks cannot drift
 * from the rule that flags a site. The words are still the measurement; the
 * bar is `aria-hidden`.
 */
export function CoverageMeter({
  coverage,
  locale,
  metric,
}: {
  readonly coverage: Coverage
  readonly locale: Locale
  readonly metric?: string
}) {
  const thin = coverage.confidence.type === 'thin'
  const label =
    coverage.confidence.type === 'thin'
      ? d('coverageThin', locale)
      : coverage.confidence.type === 'moderate'
        ? d('coverageModerate', locale)
        : d('coverageGood', locale)
  const x = (share: number) => (Math.min(share, METER_MAX) / METER_MAX) * 100

  return (
    <div className={thin ? 'border-l-2 border-ink pl-3' : undefined}>
      <p data-metric={metric} className="tabular m-0 flex items-baseline justify-between gap-2 font-sans text-xs">
        <span className="text-ink-muted">
          {thin ? <span aria-hidden="true">⚑ </span> : null}
          {d('coverage', locale)}
        </span>
        <span className="font-mono">
          {percent(coverage.pedestrianShare)} · {label}
        </span>
      </p>
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-1 block h-2 w-full" aria-hidden="true">
        <rect x={0} y={2.5} width={100} height={3} fill="var(--well)" />
        <rect x={0} y={2.5} width={x(coverage.pedestrianShare)} height={3} fill="var(--ink)" />
        <line className="ruler-axis" x1={x(THIN_COVERAGE_THRESHOLD)} x2={x(THIN_COVERAGE_THRESHOLD)} y1={0} y2={8} />
        <line className="ruler-axis" x1={x(GOOD_COVERAGE_THRESHOLD)} x2={x(GOOD_COVERAGE_THRESHOLD)} y1={0} y2={8} />
      </svg>
      {thin ? (
        <p className="m-0 mt-2 font-sans text-xs leading-note">
          {locale === 'id'
            ? 'Gang belum terpetakan; selisihnya tidak dibaca sebagai temuan.'
            : 'The gang are not mapped; the gap here is not read as a finding.'}
        </p>
      ) : null}
    </div>
  )
}
