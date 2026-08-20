import { binRangeDeg } from "@/lib/morphology";
import { d, type Locale } from "@/lib/i18n";
import { percent } from "@/lib/format";
import type { Mode } from "@/lib/tags";

/**
 * The rose's text equivalent — 36 bins with their bearing ranges and shares.
 *
 * Always available, never a fallback (DESIGN.md §10). It is also what someone
 * would paste into a message, which is why the numbers are plain text in a
 * real table rather than an image description.
 */
export interface RoseTableProps {
  readonly locale: Locale;
  readonly series: readonly {
    readonly mode: Mode;
    readonly shares: readonly number[];
  }[];
  readonly label: string;
}

export function RoseTable({ locale, series, label }: RoseTableProps) {
  const first = series[0];
  if (first === undefined) return null;

  return (
    <details className="mt-2 border-t border-rule-strong pt-2">
      <summary className="cursor-pointer font-sans text-xs">
        {d("roseTable", locale)} — {label}
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
        aria-label={`${d("roseTable", locale)} — ${label}`}
        className="mt-2 overflow-x-auto"
      >
        <table className="tabular w-full border-collapse font-mono text-xs">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-rule-strong text-left">
              <th scope="col" className="py-1 pr-4 font-normal">
                {d("bin", locale)}
              </th>
              <th scope="col" className="py-1 pr-4 font-normal">
                {d("bearingRange", locale)}
              </th>
              {series.map((s) => (
                <th
                  key={s.mode}
                  scope="col"
                  className="py-1 pr-4 text-right font-normal"
                >
                  {d(s.mode === "drive" ? "drive" : "walk", locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {first.shares.map((_, index) => {
              const range = binRangeDeg(index);
              return (
                <tr key={index} className="border-b border-rule-faint">
                  <th scope="row" className="py-px pr-4 text-left font-normal">
                    {String(index).padStart(2, "0")}
                  </th>
                  <td className="py-px pr-4">
                    {range.startDeg.toFixed(0)}°–{range.endDeg.toFixed(0)}°
                  </td>
                  {series.map((s) => (
                    <td key={s.mode} className="py-px pr-4 text-right">
                      {percent(s.shares[index] ?? 0, 2)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
