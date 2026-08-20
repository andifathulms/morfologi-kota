import { binRangeDeg } from '@/lib/morphology'
import { d, type Locale } from '@/lib/i18n'
import { fixed, percent } from '@/lib/format'
import type { Mode } from '@/lib/tags'

/**
 * The rose's text equivalent — 36 bins with their bearing ranges and shares.
 *
 * Always available, never a fallback (DESIGN.md §10). It is also what someone
 * would paste into a message, which is why the numbers are plain text in a
 * real table rather than an image description.
 */
export interface RoseTableProps {
  readonly locale: Locale
  readonly series: readonly {
    readonly mode: Mode
    readonly shares: readonly number[]
    /** Each bin's term in H. Emitted by the pipeline; summed here for display only. */
    readonly binContributions: readonly number[]
    readonly orientationEntropy: number
  }[]
  readonly label: string
}

export function RoseTable({ locale, series, label }: RoseTableProps) {
  const first = series[0]
  if (first === undefined) return null

  return (
    <details className="mt-2 border-t border-rule-strong pt-2">
      <summary className="cursor-pointer font-sans text-xs">
        {d('roseTable', locale)} — {label}
      </summary>
      {/*
        Focusable, because at 320 px this table is wider than its card and
        there is nothing inside it to tab to — thirty-six rows of numbers and
        no links. Without a focus stop a keyboard user could open the
        disclosure and then not reach the columns it revealed. WCAG 2.1.1.
      */}
      <div
        tabIndex={0}
        role="group"
        aria-label={`${d('roseTable', locale)} — ${label}`}
        className="mt-2 overflow-x-auto"
      >
        <table className="tabular w-full border-collapse font-mono text-xs">
          {/* Describes the table. It used to repeat the site name, which the
            summary directly above already carries — a second, worse copy of
            a name rather than a statement of what the rows are. */}
        <caption className="sr-only">{d('roseTableCaption', locale)}</caption>
          <thead>
            <tr className="border-b border-rule-strong text-left">
              <th scope="col" className="py-1 pr-4 font-normal">
                {d('bin', locale)}
              </th>
              <th scope="col" className="py-1 pr-4 font-normal">
                {d('bearingRange', locale)}
              </th>
              {series.map((s) => (
                <th
                  key={s.mode}
                  scope="col"
                  className="py-1 pr-4 text-right font-normal"
                >
                  P — {d(s.mode === 'drive' ? 'drive' : 'walk', locale)}
                </th>
              ))}
              {series.map((s) => (
                <th
                  key={`${s.mode}-term`}
                  scope="col"
                  className="py-1 pr-4 text-right font-normal"
                  style={{ color: s.mode === 'drive' ? 'var(--drive)' : 'var(--walk)' }}
                >
                  {d('entropyTerm', locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {first.shares.map((_, index) => {
              const range = binRangeDeg(index)
              return (
                <tr key={index} className="border-b border-rule-faint">
                  <th scope="row" className="py-px pr-4 text-left font-normal">
                    {String(index).padStart(2, '0')}
                  </th>
                  <td className="py-px pr-4">
                    {range.startDeg.toFixed(0)}°–{range.endDeg.toFixed(0)}°
                  </td>
                  {series.map((s) => (
                    <td key={s.mode} className="py-px pr-4 text-right">
                      {percent(s.shares[index] ?? 0, 2)}
                    </td>
                  ))}
                  {series.map((s) => (
                    <td key={`${s.mode}-term`} className="py-px pr-4 text-right">
                      {fixed(s.binContributions[index] ?? 0, 4)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
          {/*
            The step that was missing. The rose and its H sat side by side with
            nothing between them; this is the sum, in the same table as the
            thirty-six numbers it is a sum of. The terms come from the pipeline
            and data:validate asserts they add to this figure — nothing is
            computed here (CLAUDE.md, Invariants §16).
          */}
          <tfoot>
            <tr className="border-t border-rule-strong">
              <th
                scope="row"
                colSpan={2 + series.length}
                className="py-1 pr-4 text-left font-semibold"
              >
                {d('entropyTotal', locale)}
              </th>
              {series.map((s) => (
                <td key={`${s.mode}-sum`} className="py-1 pr-4 text-right font-semibold">
                  {fixed(s.orientationEntropy, 3)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-2 max-w-prose font-sans text-base leading-snug text-ink-muted">
        {d('entropyDerivation', locale)}
      </p>
    </details>
  )
}
