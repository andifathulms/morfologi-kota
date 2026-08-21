import { binRangeDeg } from '@/lib/morphology'
import type { Mode } from '@/lib/tags'
import { d, type Locale } from '@/lib/i18n'
import { fixed, percent } from '@/lib/format'

/**
 * The rose — 36 bins, per Boeing 2019.
 *
 * Bar direction is the compass bearing of the streets in that bin; bar length
 * is their relative frequency, length-weighted. North at top, clockwise,
 * cardinal ticks, and a hairline circle at the maximum so bar lengths are
 * readable against a bound (DESIGN.md §4).
 *
 * Overlaid series overprint. Both inks multiply against the sheet and against
 * each other, so where the two networks run the same way the wedge is the
 * colour the two inks make together — produced rather than declared, and the
 * same operation a two-colour press performs. Blend order does not matter,
 * because multiply is commutative; the sort below survives for the fallback
 * path, where it still does.
 *
 * The shape cue stays regardless. Overprint gives the overlap a colour of its
 * own; it does not make blue and rust separable from *each other*, which they
 * are not — they sit at 1.4:1. So walk keeps its heavy outline, and a reader
 * who does not separate the two hues still reads three distinct regions.
 *
 * Symmetric by construction — the assertion lives in the invariant suite and
 * in `data:validate`, so an asymmetric rose cannot reach this component.
 *
 * Every rose renders with its entropy and φ. They are required props, not
 * optional ones: a rose without its numbers is a shape, not a measurement
 * (CLAUDE.md, Invariants §12).
 */

const VIEW = 100
const RING = 78

/**
 * What a series is a series *of*.
 *
 * The two modes carry the product's two hues, and they carry them alone:
 * `--drive` and `--walk` exist to make the drive/walk gap the only coloured
 * thing on the page (DESIGN.md §3). The calibration fixtures are neither
 * mode — a perfect grid is not a driving network — so they are `reference`,
 * and they are drawn in ink.
 */
export type RoseSeriesKind = Mode | 'reference'

export interface RoseSeries {
  readonly shares: readonly number[]
  readonly kind: RoseSeriesKind
  readonly orientationEntropy: number
  readonly orientationOrder: number
}

export interface RoseProps {
  /** One series, or two to overlay in the paired view. */
  readonly series: readonly RoseSeries[]
  readonly locale: Locale
  readonly size?: number
  readonly animate?: boolean
  /** Rendered under the rose. Required for a single series; §12. */
  readonly caption?: boolean
  /**
   * The one-paragraph statement of what the bars are. On by default; the plate
   * turns it off, because sixteen cards do not need sixteen copies of one
   * paragraph — the plate states it once, next to its rose key.
   */
  readonly method?: boolean
}

function wedgePath(index: number, radius: number): string {
  const halfWidthDeg = 5
  const centreDeg = index * 10
  const startRad = ((centreDeg - halfWidthDeg - 90) * Math.PI) / 180
  const endRad = ((centreDeg + halfWidthDeg - 90) * Math.PI) / 180
  const x1 = Math.cos(startRad) * radius
  const y1 = Math.sin(startRad) * radius
  const x2 = Math.cos(endRad) * radius
  const y2 = Math.sin(endRad) * radius
  return `M 0 0 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

function inkFor(kind: RoseSeriesKind): string {
  switch (kind) {
    case 'drive':
      return 'var(--drive)'
    case 'walk':
      return 'var(--walk)'
    /* Not a hue. A calibration fixture is neither network, and spending one of
       the two inks on it would put colour on something that is not the
       comparison (DESIGN.md §3). */
    case 'reference':
      return 'var(--ink)'
    default: {
      const never: never = kind
      throw new Error(`unknown series kind: ${String(never)}`)
    }
  }
}

/**
 * The series' name, or nothing where it does not have one.
 *
 * A reference network is titled by the figure it sits in — its own heading and
 * its drawing's label — so naming it here would only give it a name it is not.
 * It still prints its H and its φ, which is what §4 requires of every rose.
 */
function nameFor(kind: RoseSeriesKind, locale: Locale): string | undefined {
  switch (kind) {
    case 'drive':
      return d('drive', locale)
    case 'walk':
      return d('walk', locale)
    case 'reference':
      return undefined
    default: {
      const never: never = kind
      throw new Error(`unknown series kind: ${String(never)}`)
    }
  }
}

/**
 * The non-chromatic half of the distinction, used only where the two series
 * are overlaid: solid for drive, outlined for walk.
 *
 * The fill opacities here are the *fallback*. `globals.css` raises both to 1
 * and turns on multiply inside `@supports (mix-blend-mode: multiply)`, so a
 * browser without blending keeps the older transparency treatment and one
 * with it gets the overprint. Presentation attributes lose to a stylesheet
 * rule, which is what makes the enhancement work with no script.
 */
function overlaid(kind: RoseSeriesKind): { fillOpacity: number; strokeWidth: number } {
  // Only ever reached with two series, and a reference network is never one of
  // a pair — it is a single fixture standing on its own.
  return kind === 'walk' ? { fillOpacity: 0.14, strokeWidth: 2 } : { fillOpacity: 0.6, strokeWidth: 0.5 }
}

export function Rose({
  series,
  locale,
  size = 180,
  animate = true,
  caption = true,
  method = true,
}: RoseProps) {
  // The smaller series is drawn in front, so neither hides the other
  // (DESIGN.md §4).
  const ordered = [...series].sort(
    (a, b) => Math.max(...b.shares) - Math.max(...a.shares),
  )
  const peak = Math.max(...series.flatMap((s) => [...s.shares]), 1e-9)

  return (
    <figure className="m-0">
      <svg
        viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
        width={size}
        height={size}
        /* Isolated, so the inks multiply with the sheet and each other and not
           with whatever the page has painted behind the figure. */
        style={series.length > 1 ? { isolation: 'isolate' } : undefined}
        role="img"
        aria-label={series
          .map((s) => {
            const name = nameFor(s.kind, locale)
            const numbers = `H ${fixed(s.orientationEntropy, 2)}, φ ${fixed(s.orientationOrder, 2)}`
            return name === undefined ? numbers : `${name}: ${numbers}`
          })
          .join('; ')}
      >
        {/* The bound: a hairline circle at the maximum share. */}
        <circle cx={0} cy={0} r={RING} fill="none" stroke="var(--rule)" strokeWidth={0.5} />
        {/* Cardinal ticks at 0°, 90°, 180°, 270°. */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={Math.cos(rad) * RING}
              y1={Math.sin(rad) * RING}
              x2={Math.cos(rad) * (RING + 8)}
              y2={Math.sin(rad) * (RING + 8)}
              stroke="var(--rule)"
              strokeWidth={0.5}
            />
          )
        })}
        <text
          x={0}
          y={-RING - 12}
          textAnchor="middle"
          className="font-mono"
          fontSize={11}
          fill="var(--ink)"
        >
          N
        </text>

        {ordered.map((s) =>
          s.shares.map((share, index) => {
            if (share <= 0) return null
            const radius = (share / peak) * RING
            const range = binRangeDeg(index)
            return (
              <path
                key={`${s.kind}-${index}`}
                d={wedgePath(index, radius)}
                fill={inkFor(s.kind)}
                fillOpacity={series.length > 1 ? overlaid(s.kind).fillOpacity : 0.9}
                stroke={inkFor(s.kind)}
                strokeWidth={series.length > 1 ? overlaid(s.kind).strokeWidth : 0.5}
                strokeLinejoin="round"
                className={[series.length > 1 ? 'rose-ink' : '', animate ? 'rose-bar' : '']
                  .filter(Boolean)
                  .join(' ')}
                style={animate ? { animationDelay: `${240 + index * 8}ms` } : undefined}
              >
                <title>
                  {[
                    nameFor(s.kind, locale),
                    `${range.startDeg.toFixed(0)}°–${range.endDeg.toFixed(0)}°`,
                    percent(share, 1),
                  ]
                    .filter((part) => part !== undefined)
                    .join(' · ')}
                </title>
              </path>
            )
          }),
        )}
      </svg>

      {caption ? (
        <figcaption className="tabular mt-1 font-mono text-xs">
          {series.map((s) => {
            const name = nameFor(s.kind, locale)
            return (
              <span key={s.kind} className="mr-4 inline-flex items-center gap-1">
                {series.length > 1 ? (
                  <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true">
                    <rect
                      x={s.kind === 'walk' ? 1 : 0.5}
                      y={s.kind === 'walk' ? 1 : 0.5}
                      width={s.kind === 'walk' ? 8 : 9}
                      height={s.kind === 'walk' ? 8 : 9}
                      fill={inkFor(s.kind)}
                      fillOpacity={overlaid(s.kind).fillOpacity}
                      stroke={inkFor(s.kind)}
                      strokeWidth={s.kind === 'walk' ? 2 : 0.5}
                    />
                  </svg>
                ) : null}
                {name === undefined ? null : (
                  <>
                    <span style={{ color: inkFor(s.kind) }}>{name}</span>{' '}
                  </>
                )}
                H {fixed(s.orientationEntropy, 3)} · φ {fixed(s.orientationOrder, 2)}
              </span>
            )
          })}
        </figcaption>
      ) : null}

      {/*
        The method, next to the figure that uses it.
        Boeing 2019 §3 fixes the 36 bins and the length weighting; both were
        stated only on the method page, so a reader met the rose everywhere in
        the product with no way to know what the bars measure. A caption, not a
        tooltip — a tooltip is invisible on touch and unsearchable.
      */}
      {caption && method ? (
        <figcaption className="mt-2 max-w-prose font-sans text-base leading-snug text-ink-muted">
          {d('roseMethod', locale)} {d('roseSymmetryNote', locale)}{' '}
          <span className="font-mono text-xs">Boeing 2019 §3</span>
        </figcaption>
      ) : null}
    </figure>
  )
}
