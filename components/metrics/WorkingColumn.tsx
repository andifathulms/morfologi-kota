import type { ModeMetrics } from '@/lib/morphology'
import type { Mode } from '@/lib/tags'
import { d, type Locale } from '@/lib/i18n'
import { fixed, kilometres, perKm2 } from '@/lib/format'

/**
 * The working — the intermediate values behind the metric column.
 *
 * Every number here was already computed by the pipeline and shipped in the
 * bundle, and none of it reached the page: node and edge counts, the
 * intersection count that is the numerator of intersection density, the
 * weighted length that is the denominator turning a rose bar into a share,
 * and the per-edge circuity that is a different measure from the sampled one
 * the column prints.
 *
 * Showing inputs and answers and hiding the middle is what makes a measurement
 * look like an assertion. Nothing is computed here — the disc area follows
 * from the radius, which is printed on every card (CLAUDE.md, Invariants §16).
 */
export function WorkingColumn({
  metrics,
  mode,
  radiusM,
  locale,
}: {
  readonly metrics: ModeMetrics
  readonly mode: Mode
  readonly radiusM: number
  readonly locale: Locale
}) {
  const areaKm2 = (Math.PI * radiusM * radiusM) / 1_000_000

  const rows: readonly { label: string; value: string }[] = [
    { label: d('nodeCount', locale), value: String(metrics.degrees.nodeCount) },
    { label: d('edgeCount', locale), value: String(metrics.degrees.edgeCount) },
    { label: d('intersectionCount', locale), value: String(metrics.degrees.intersectionCount) },
    { label: d('discArea', locale), value: `${fixed(areaKm2, 2)} km²` },
    {
      label: d('intersectionDensity', locale),
      value: perKm2(metrics.intersectionDensityPerKm2),
    },
    { label: d('weightedLength', locale), value: kilometres(metrics.rose.totalWeight) },
    { label: d('edgeCircuity', locale), value: fixed(metrics.edgeCircuity, 3) },
  ]

  return (
    <div className="font-mono text-xs">
      <p className="m-0 mb-1 font-sans text-base font-semibold" style={{ color: `var(--${mode})` }}>
        {d('workingHeading', locale)}
      </p>
      <dl className="tabular m-0 grid grid-cols-[1fr_auto] gap-x-4">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="border-b border-rule-faint py-px text-ink-subtle">{row.label}</dt>
            <dd className="m-0 border-b border-rule-faint py-px text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 max-w-prose font-sans text-base leading-snug text-ink-muted">
        {d('workingNote', locale)} {d('edgeCircuityNote', locale)}
      </p>
    </div>
  )
}
