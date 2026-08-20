import type { Mode } from '@/lib/tags'

/**
 * The network drawing.
 *
 * Ink hairlines on plate, uniform weight — no road-class hierarchy and no
 * colour (DESIGN.md §5). This is a morphology study, not a wayfinding map:
 * drawing arterials thicker would imply an importance the analysis does not
 * use, and would visually flatten the fine grain that is the whole point in a
 * kampung.
 *
 * Fixed-radius circular clip, with the boundary drawn as a hairline so the
 * sampling edge is visible rather than implied. No labels, no basemap, no
 * landmarks — the shape is the subject.
 */

export interface NetworkDrawingProps {
  /** Polylines in local metres about the site centre, as emitted. */
  readonly geometry: readonly (readonly (readonly [number, number])[])[]
  readonly radiusM: number
  readonly size?: number
  readonly animate?: boolean
  /**
   * Only used for the accessible label — the drawing itself is ink, never the
   * mode hue.
   */
  readonly mode: Mode
  readonly label: string
}

function pathFor(line: readonly (readonly [number, number])[]): string {
  let d = ''
  for (let i = 0; i < line.length; i += 1) {
    const point = line[i]
    if (point === undefined) continue
    // y is flipped: metres run north, SVG runs down.
    d += `${i === 0 ? 'M' : 'L'}${point[0].toFixed(0)} ${(-point[1]).toFixed(0)}`
  }
  return d
}

function lengthOf(line: readonly (readonly [number, number])[]): number {
  let total = 0
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1]
    const b = line[i]
    if (a === undefined || b === undefined) continue
    total += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return total
}

export function NetworkDrawing({
  geometry,
  radiusM,
  size = 220,
  animate = true,
  label,
}: NetworkDrawingProps) {
  const clipId = `clip-${label.replace(/[^a-z0-9]/gi, '')}`
  // Hairline at the drawn size: 0.5 device px expressed in metres of viewBox.
  const stroke = ((2 * radiusM) / size) * 0.9

  return (
    <svg
      viewBox={`${-radiusM} ${-radiusM} ${radiusM * 2} ${radiusM * 2}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={0} cy={0} r={radiusM} />
        </clipPath>
      </defs>
      <circle cx={0} cy={0} r={radiusM} fill="none" stroke="var(--rule)" strokeWidth={stroke} />
      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {geometry.map((line, index) => {
          const dash = Math.max(1, Math.round(lengthOf(line)))
          return (
            <path
              key={index}
              d={pathFor(line)}
              className={animate ? 'network-ink' : undefined}
              style={
                animate
                  ? ({
                      '--dash': `${dash}`,
                      animationDelay: `${(index % 40) * 8}ms`,
                    } as React.CSSProperties)
                  : undefined
              }
            />
          )
        })}
      </g>
    </svg>
  )
}
