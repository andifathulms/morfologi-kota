import type { ModeMetrics } from '@/lib/morphology'
import type { Mode } from '@/lib/tags'
import { d, type Locale } from '@/lib/i18n'
import { fixed, kilometres, metres, perKm2, percent } from '@/lib/format'

/**
 * The metric column (PRD §6.4).
 *
 * Monospace, tabular, always with units — the columns are read down and
 * compared across cards, and proportional figures would break the alignment
 * that makes that possible (DESIGN.md §7).
 *
 * The order is fixed across every card so the eye can travel between them.
 * Nothing here is computed: every number came from the pipeline.
 */

export interface MetricRow {
  readonly label: string
  readonly value: string
  readonly hint?: string
}

export function metricRows(metrics: ModeMetrics, locale: Locale): readonly MetricRow[] {
  return [
    { label: d('entropy', locale), value: fixed(metrics.orientationEntropy, 3), hint: 'nat' },
    { label: 'H / H max', value: fixed(metrics.normalisedEntropy, 3) },
    { label: d('phi', locale), value: fixed(metrics.orientationOrder, 3) },
    // Marked as sampled where it is printed. It is a seeded estimate over a
    // subset of node pairs, and it sat in the same column, same weight, as
    // measured quantities like network length.
    {
      label: d('circuity', locale),
      value: fixed(metrics.sampledCircuity, 3),
      hint: `~${metrics.sampledPairCount}`,
    },
    { label: d('averageDegree', locale), value: fixed(metrics.degrees.averageDegree, 2) },
    { label: d('fourWay', locale), value: percent(metrics.degrees.proportions.fourWay) },
    { label: d('deadEnd', locale), value: percent(metrics.degrees.proportions.deadEnd) },
    {
      label: d('intersectionDensity', locale),
      value: perKm2(metrics.intersectionDensityPerKm2),
    },
    { label: d('medianSegment', locale), value: metres(metrics.medianSegmentLengthM) },
    { label: d('totalLength', locale), value: kilometres(metrics.totalLengthM) },
  ]
}

export function MetricColumn({
  metrics,
  mode,
  locale,
  heading,
  notes = false,
}: {
  readonly metrics: ModeMetrics
  readonly mode: Mode
  readonly locale: Locale
  readonly heading?: boolean
  /**
   * Print the paragraph explaining H's unit and circuity's sampling under the
   * column. On where there is room — the pair — and off on the plate, where
   * sixteen cards would carry sixteen copies of it.
   */
  readonly notes?: boolean
}) {
  const rows = metricRows(metrics, locale)
  const hue = mode === 'drive' ? 'var(--drive)' : 'var(--walk)'

  return (
    <div className="font-mono text-xs">
      {heading ? (
        <p className="mb-1 font-sans text-base font-semibold" style={{ color: hue }}>
          {d(mode === 'drive' ? 'drive' : 'walk', locale)}
        </p>
      ) : null}
      <dl className="tabular m-0 grid grid-cols-[1fr_auto] gap-x-4">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="border-b border-rule-faint py-px text-ink-subtle">{row.label}</dt>
            <dd className="m-0 border-b border-rule-faint py-px text-right">
              {row.value}
              {row.hint ? <span className="ml-1 text-ink-subtle">{row.hint}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      {/*
        The two figures in this column that are not measurements, said under
        the column rather than on a method page: H's unit, which is printed on
        every card and was defined nowhere, and circuity's sampling, which was
        presented in the same weight as network length.

        Only where the column has room — the pair. The plate prints the sample
        size beside the number and leaves the paragraph to this view.
      */}
      {notes ? (
        <div className="mt-3 max-w-prose font-sans text-base leading-snug text-ink-muted">
          <p className="m-0">{d('natNote', locale)}</p>
          <p className="m-0 mt-2">
            {d('circuitySampled', locale)}{' '}
            <span className="tabular font-mono text-xs">
              {metrics.sampledPairCount} {d('sampledPairs', locale)}
            </span>
            {metrics.unreachablePairCount > 0 ? (
              <>
                {' · '}
                <span className="tabular font-mono text-xs">
                  {metrics.unreachablePairCount} {d('unreachablePairs', locale)}
                </span>{' '}
                {d('unreachableNote', locale)}
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  )
}
