import type { Coverage } from '@/lib/morphology'
import { d, type Locale } from '@/lib/i18n'
import { percent } from '@/lib/format'

/**
 * The running head (DESIGN.md §6b).
 *
 * A pair page is three figures, two metric columns and a difference drawing,
 * and it is taller than any screen it will be read on. Somewhere past the
 * second disc a reader has lost the two things every figure on the page is
 * conditional on: which place this is, and at what radius and coverage it was
 * measured. A journal solves this with a running head, and so does this.
 *
 * It is the legend contract made continuous rather than a second copy of it
 * (§9). The full band — tag mapping, extract version, the coverage sentence —
 * stays in the margin rail at the top of the page, where there is room to say
 * it properly; this is the one-line form that stays in view.
 *
 * Sticky, not fixed, and it carries no script: it scrolls with the article
 * until it reaches the top of the viewport and stops there. A reader who has
 * scrolled past it in the document has not scrolled past what it says.
 */
export function RunningHead({
  name,
  city,
  type,
  radiusM,
  coverage,
  locale,
}: {
  readonly name: string
  readonly city: string
  readonly type: string
  readonly radiusM: number
  readonly coverage: Coverage
  readonly locale: Locale
}) {
  const thin = coverage.confidence.type === 'thin'
  const label =
    coverage.confidence.type === 'thin'
      ? d('coverageThin', locale)
      : coverage.confidence.type === 'moderate'
        ? d('coverageModerate', locale)
        : d('coverageGood', locale)

  return (
    <div
      /*
       * `-mx-4 px-4` so the rule runs the full width of the plate's gutter
       * rather than stopping at the text column, which is what makes it read
       * as a running head instead of a stray line of type. The ground is
       * painted, or the figures beneath would scroll through it.
       */
      className="tabular sticky top-0 z-10 -mx-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink bg-plate px-4 py-2 font-mono text-xs"
    >
      <p className="m-0">
        <span className="font-semibold">{name}</span>
        <span className="text-ink-subtle">
          {' '}
          · {city} · {type}
        </span>
      </p>
      <p className="m-0">
        r = {radiusM} m · 36 bin ·{' '}
        <span className={thin ? 'font-semibold' : undefined}>
          {thin ? <span aria-hidden="true">⚑ </span> : null}
          {d('coverage', locale)} {percent(coverage.pedestrianShare)} · {label}
        </span>
      </p>
    </div>
  )
}
