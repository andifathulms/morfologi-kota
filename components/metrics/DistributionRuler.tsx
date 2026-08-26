import type { Locale } from '@/lib/i18n'
import { fixed } from '@/lib/format'

/**
 * Where one figure sits among the figures it belongs with (DESIGN.md §6a).
 *
 * `φ 0.308` alone is unreadable. Ordered, or not? The answer is in the other
 * fifteen sites, which on this plate are two screens away, and a reader who
 * cannot see them reads every number as though it were absolute. The ruler is
 * the set, drawn: a hairline axis over the observed range, one faint tick per
 * site, and this site's mark where it falls.
 *
 * ## It is a distribution, not a league table
 *
 * PRD §4 forbids a score, a grade, a ranking and an index, and this is none of
 * them — but it is the closest thing in the product to something that could be
 * misread as one, so the guards are deliberate and they are all here:
 *
 * - **The axis is the observed range of these sites**, not a scale with a good
 *   end. Nothing marks either end as preferable, because nothing about the
 *   measurement makes either end preferable.
 * - **No colour ramp, no gradient, no diverging scale.** The mark takes its
 *   series' ink and the ticks are `--rule-strong`; there is no third hue and
 *   no continuum from bad to good (DESIGN.md §3).
 * - **The text equivalent says "sorted by", not "ranked".** The position is
 *   stated as what it is — where the site falls when the set is sorted by this
 *   metric, ascending, which is the operation §4 explicitly permits.
 * - **The set is not a population.** Sixteen sites chosen for data
 *   completeness are not a sample of Indonesian urban form, and the plate says
 *   so above the grid. A mark at the end of a ruler is the end of *this* set.
 *
 * ## Both modes share one axis
 *
 * The drive ruler and the walk ruler are drawn on the same range — the extremes
 * of every site in both modes — so the horizontal distance between the two
 * marks *is* ΔH. Two independently scaled rulers would put the two numbers on
 * two different axes and the gap, which is the product's entire subject, would
 * be the one thing the figure could not show.
 */

export interface DistributionPoint {
  readonly slug: string
  readonly value: number
}

export interface DistributionRulerProps {
  /** Every site's value for this metric, in this mode — one tick each. */
  readonly points: readonly DistributionPoint[]
  /** The axis, shared across both modes so the two marks are comparable. */
  readonly min: number
  readonly max: number
  readonly value: number
  /** `--drive`, `--walk`, or ink where the metric belongs to no mode. */
  readonly ink: string
  /** Named in the text equivalent, e.g. "H — Kendara". */
  readonly label: string
  readonly places: number
  readonly locale: Locale
}

/** 0 at the low end of the observed range, 100 at the high end. */
export function rulerPosition(value: number, min: number, max: number): number {
  if (max <= min) return 50
  const clamped = Math.min(Math.max(value, min), max)
  return ((clamped - min) / (max - min)) * 100
}

/**
 * Where this value falls when the set is sorted smallest first.
 *
 * Stated as a sort, computed as a sort: the count of values below it, plus
 * one. Ties share a position, which is the honest answer — two sites with the
 * same H are not first and second at anything (PRD §4).
 */
export function rulerRank(points: readonly DistributionPoint[], value: number): number {
  return points.filter((point) => point.value < value).length + 1
}

export function DistributionRuler({
  points,
  min,
  max,
  value,
  ink,
  label,
  places,
  locale,
}: DistributionRulerProps) {
  const x = rulerPosition(value, min, max)
  /* Ascending, and the sentence says ascending. A position is only meaningful
     with the direction stated, and stating it is also what keeps it a sort. */
  const rank = rulerRank(points, value)

  const sentence =
    locale === 'id'
      ? `${label} ${fixed(value, places)} — posisi ke-${rank} dari ${points.length} bila set diurutkan menurut metrik ini dari yang terkecil. Rentang set ${fixed(min, places)}–${fixed(max, places)}.`
      : `${label} ${fixed(value, places)} — position ${rank} of ${points.length} when the set is sorted by this metric, smallest first. Set range ${fixed(min, places)}–${fixed(max, places)}.`

  return (
    <span className="block">
      {/*
        `preserveAspectRatio="none"` lets the axis be the width of whatever
        column it lands in without the card having to know that width. Every
        stroke carries `vector-effect`, so the non-uniform scale stretches the
        positions and not the hairlines — without it a tick would come out
        several pixels wide on a wide card and sub-pixel on a phone.
      */}
      <svg
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className="block h-3 w-full"
        aria-hidden="true"
      >
        <line x1={0} y1={5} x2={100} y2={5} stroke="var(--rule)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {points.map((point) => (
          <line
            key={point.slug}
            data-tick={point.slug}
            x1={rulerPosition(point.value, min, max)}
            y1={3}
            x2={rulerPosition(point.value, min, max)}
            y2={7}
            stroke="var(--rule-strong)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1={x}
          y1={0}
          x2={x}
          y2={10}
          stroke={ink}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="sr-only">{sentence}</span>
    </span>
  )
}
