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
 * The two series are separated by shape as well as hue: drive is a solid fill,
 * walk is a light fill with a heavy outline. The hues sit at 1.4:1 to each
 * other, so hue alone never distinguished them for a reader who does not
 * separate blue from rust, or for anyone printing in greyscale. The swatches
 * in `ModeKey` draw the same two treatments.
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

export interface RoseSeries {
  readonly shares: readonly number[]
  readonly mode: Mode
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

function strokeFor(mode: Mode): string {
  return mode === 'drive' ? 'var(--drive)' : 'var(--walk)'
}

/**
 * The non-chromatic half of the distinction, used only where the two series
 * are overlaid: solid for drive, outlined for walk. A single series keeps the
 * plain solid treatment, since there is nothing for it to be confused with.
 */
function overlaid(mode: Mode): { fillOpacity: number; strokeWidth: number } {
  return mode === 'drive' ? { fillOpacity: 0.6, strokeWidth: 0.5 } : { fillOpacity: 0.14, strokeWidth: 2 }
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
        role="img"
        aria-label={series
          .map(
            (s) =>
              `${d(s.mode === 'drive' ? 'drive' : 'walk', locale)}: H ${fixed(s.orientationEntropy, 2)}, φ ${fixed(s.orientationOrder, 2)}`,
          )
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
                key={`${s.mode}-${index}`}
                d={wedgePath(index, radius)}
                fill={strokeFor(s.mode)}
                fillOpacity={series.length > 1 ? overlaid(s.mode).fillOpacity : 0.9}
                stroke={strokeFor(s.mode)}
                strokeWidth={series.length > 1 ? overlaid(s.mode).strokeWidth : 0.5}
                strokeLinejoin="round"
                className={animate ? 'rose-bar' : undefined}
                style={animate ? { animationDelay: `${240 + index * 8}ms` } : undefined}
              >
                <title>
                  {`${d(s.mode === 'drive' ? 'drive' : 'walk', locale)} · ${range.startDeg.toFixed(0)}°–${range.endDeg.toFixed(0)}° · ${percent(share, 1)}`}
                </title>
              </path>
            )
          }),
        )}
      </svg>

      {caption ? (
        <figcaption className="tabular mt-1 font-mono text-xs">
          {series.map((s) => (
            <span key={s.mode} className="mr-4 inline-flex items-center gap-1">
              {series.length > 1 ? (
                <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true">
                  <rect
                    x={s.mode === 'drive' ? 0.5 : 1}
                    y={s.mode === 'drive' ? 0.5 : 1}
                    width={s.mode === 'drive' ? 9 : 8}
                    height={s.mode === 'drive' ? 9 : 8}
                    fill={strokeFor(s.mode)}
                    fillOpacity={overlaid(s.mode).fillOpacity}
                    stroke={strokeFor(s.mode)}
                    strokeWidth={s.mode === 'drive' ? 0.5 : 2}
                  />
                </svg>
              ) : null}
              <span style={{ color: strokeFor(s.mode) }}>
                {d(s.mode === 'drive' ? 'drive' : 'walk', locale)}
              </span>{' '}
              H {fixed(s.orientationEntropy, 3)} · φ {fixed(s.orientationOrder, 2)}
            </span>
          ))}
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
