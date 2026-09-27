import type { ModeMetrics } from '@/lib/morphology'
import { d, type Locale } from '@/lib/i18n'
import { metricRows } from '@/components/metrics/MetricColumn'

/**
 * Both modes in one table — the plate card's metric column.
 *
 * The card used to print ten rows for the driving network only, and a reader
 * who wanted the walking figure had to open the pair. Two columns side by side
 * are the comparison the product is about, in less height than one column
 * took, because each metric's name is printed once instead of once per mode.
 *
 * The rows are `metricRows` with the headline figures dropped, so the values,
 * units and order are the ones every other column in the product prints. The
 * sort key rides on the drive cell, which is the value the plate's per-mode
 * sorts order by (DESIGN.md §6).
 *
 * Names are sans and figures mono (DESIGN.md §7). Nothing is computed here.
 */
export function PairMetricTable({
  drive,
  walk,
  locale,
  label,
}: {
  readonly drive: ModeMetrics
  readonly walk: ModeMetrics
  readonly locale: Locale
  /** Named in the caption, so a table read on its own says whose it is. */
  readonly label: string
}) {
  const driveRows = metricRows(drive, locale, true)
  const walkRows = metricRows(walk, locale, true)

  return (
    <table className="tabular w-full border-collapse text-xs">
      <caption className="sr-only">
        {locale === 'id' ? `Metrik — ${label}` : `Metrics — ${label}`}
      </caption>
      <thead>
        <tr className="border-b border-rule-strong">
          <th scope="col" className="pb-1 text-left font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            {locale === 'id' ? 'Metrik' : 'Metric'}
          </th>
          <th scope="col" className="whitespace-nowrap pb-1 pl-2 text-right font-sans text-2xs font-semibold uppercase tracking-wide text-drive">
            {d('drive', locale)}
          </th>
          <th scope="col" className="whitespace-nowrap pb-1 pl-2 text-right font-sans text-2xs font-semibold uppercase tracking-wide text-walk">
            {d('walk', locale)}
          </th>
        </tr>
      </thead>
      <tbody>
        {driveRows.map((row, index) => {
          const walkRow = walkRows[index]
          const sampled = row.hint !== undefined && row.hint.startsWith('~')
          return (
            <tr key={row.label} className="border-b border-rule-faint">
              <th scope="row" className="py-px text-left font-sans font-normal leading-snug text-ink-muted">
                {row.label}
                {sampled ? (
                  <span className="text-ink-subtle"> · {locale === 'id' ? 'sampel' : 'sampled'}</span>
                ) : null}
              </th>
              <td data-metric={row.metric} className="whitespace-nowrap py-px pl-2 text-right font-mono text-ink-muted">
                {row.value}
              </td>
              <td className="whitespace-nowrap py-px pl-2 text-right font-mono">{walkRow?.value}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
