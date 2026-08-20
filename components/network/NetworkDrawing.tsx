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
 *
 * A site is a thousand or so segments, so they are emitted as a handful of
 * multi-subpath `path` elements rather than one element each: same ink, a
 * twentieth of the markup. `pathLength="1"` normalises every one of them, so
 * the draw animation needs no per-element style at all.
 */

export interface NetworkDrawingProps {
  /** Polylines in local metres about the site centre, as emitted. */
  readonly geometry: readonly (readonly (readonly [number, number])[])[]
  readonly radiusM: number
  readonly size?: number
  readonly animate?: boolean
  /** Only used for the accessible label — the drawing is ink, never the mode hue. */
  readonly mode: Mode
  readonly label: string
  /** How many groups the drawing is staggered across. */
  readonly buckets?: number
  /**
   * Scale to the column rather than to a fixed pixel size. `size` then bounds
   * it: a card is narrower than 200 px on a phone and wider on a desktop, and
   * the drawing should follow the column either way.
   */
  readonly responsive?: boolean
  /**
   * Distinguishes two drawings of the same site and mode on one page. The clip
   * path needs a document-unique id and the label alone is not one: the plate
   * draws Kayutangan twice — once as the worked example, once as its card —
   * and two identical ids is a broken clip, not a cosmetic duplicate.
   */
  readonly instanceId?: string
}

/**
 * Append a number, with a separator only where one is actually needed: a
 * negative number is delimited by its own minus sign. Across a plate this
 * is tens of kilobytes of markup, for no change at all to the drawing.
 */
function append(d: string, value: number): string {
  const text = String(Math.round(value))
  const needsSeparator = !text.startsWith('-') && /[0-9]$/.test(d)
  return d + (needsSeparator ? ' ' : '') + text
}

/**
 * One polyline as a subpath: an absolute move, then relative line segments.
 * The deltas are metres between shape points, so they are one or two digits
 * where the absolute coordinates would be three or four.
 */
function subpath(line: readonly (readonly [number, number])[]): string {
  const first = line[0]
  if (first === undefined) return ''
  // y is flipped: metres run north, SVG runs down.
  let d = append(append('M', first[0]), -first[1])
  let previousX = Math.round(first[0])
  let previousY = Math.round(-first[1])
  let open = false
  for (let i = 1; i < line.length; i += 1) {
    const point = line[i]
    if (point === undefined) continue
    const x = Math.round(point[0])
    const y = Math.round(-point[1])
    const dx = x - previousX
    const dy = y - previousY
    if (dx === 0 && dy === 0) continue
    if (!open) {
      d += 'l'
      open = true
    }
    d = append(append(d, dx), dy)
    previousX = x
    previousY = y
  }
  return open ? d : ''
}

export function NetworkDrawing({
  geometry,
  radiusM,
  size = 220,
  animate = true,
  label,
  buckets = 8,
  responsive = false,
  instanceId,
}: NetworkDrawingProps) {
  const clipId = `clip-${label.replace(/[^a-z0-9]/gi, '')}${instanceId === undefined ? '' : `-${instanceId}`}`
  /*
   * A hairline at the drawn size, expressed in the metres of the viewBox — the
   * drawing's user units are metres, not pixels, so this cannot be a constant
   * and CSS cannot override it with one either. `--ink-weight` is the hook a
   * stylesheet has: increased-contrast mode multiplies it rather than
   * substituting a pixel value, which would have made the lines thinner.
   */
  const stroke = ((2 * radiusM) / size) * 0.9
  const strokeWidth = `calc(${stroke.toFixed(2)} * var(--ink-weight, 1))`

  // Round-robin, so each group is spread across the whole disc and the
  // stagger reads as the network arriving rather than as one wedge at a time.
  const grouped: string[] = Array.from({ length: buckets }, () => '')
  geometry.forEach((line, index) => {
    const bucket = index % buckets
    grouped[bucket] = (grouped[bucket] ?? '') + subpath(line)
  })

  return (
    <svg
      viewBox={`${-radiusM} ${-radiusM} ${radiusM * 2} ${radiusM * 2}`}
      width={responsive ? undefined : size}
      height={responsive ? undefined : size}
      style={responsive ? { width: '100%', maxWidth: size, height: 'auto' } : undefined}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={0} cy={0} r={radiusM} />
        </clipPath>
      </defs>
      <circle
        cx={0}
        cy={0}
        r={radiusM}
        fill="none"
        stroke="var(--rule)"
        style={{ strokeWidth }}
      />
      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeWidth }}
      >
        {grouped.map((d, index) =>
          d === '' ? null : (
            <path key={index} d={d} pathLength={1} className={animate ? 'network-ink' : undefined} />
          ),
        )}
      </g>
    </svg>
  )
}

/**
 * The difference drawing — what walking adds to driving, drawn as itself.
 *
 * The pair view puts two discs side by side and asks the reader to subtract
 * one from the other by eye, which nobody does: they read the Δ column
 * instead. But "+24.6 km on foot" is a scalar, and a fine mesh threaded evenly
 * through a kampung and two cut-throughs at the edge of a superblock are
 * completely different urban facts behind an identical number. This is the
 * figure that tells them apart.
 *
 * DESIGN.md §5 says the drawings are uniform ink with no colour and no
 * weight hierarchy, and this keeps that: the walk-only edges are ink, the
 * shared network recedes to `--rule`, and no hue enters. The distinction is
 * mode membership, which the drawing is entitled to make — it is the subject —
 * rather than road class, which it is not. §5 records the rule.
 *
 * Membership comes from the pipeline, decided by the tag rule in `lib/tags`.
 * Nothing here computes it (CLAUDE.md, Invariants §16).
 */
export function NetworkDifferenceDrawing({
  geometry,
  walkOnlyIndices,
  radiusM,
  size = 220,
  animate = true,
  label,
  buckets = 8,
  responsive = false,
  instanceId,
}: Omit<NetworkDrawingProps, 'mode'> & {
  readonly walkOnlyIndices: readonly number[]
}) {
  const clipId = `clip-diff-${label.replace(/[^a-z0-9]/gi, '')}${instanceId === undefined ? '' : `-${instanceId}`}`
  const stroke = ((2 * radiusM) / size) * 0.9
  const strokeWidth = `calc(${stroke.toFixed(2)} * var(--ink-weight, 1))`

  const walkOnly = new Set(walkOnlyIndices)
  const shared: string[] = Array.from({ length: buckets }, () => '')
  const added: string[] = Array.from({ length: buckets }, () => '')
  geometry.forEach((line, index) => {
    const target = walkOnly.has(index) ? added : shared
    const bucket = index % buckets
    target[bucket] = (target[bucket] ?? '') + subpath(line)
  })

  return (
    <svg
      viewBox={`${-radiusM} ${-radiusM} ${radiusM * 2} ${radiusM * 2}`}
      width={responsive ? undefined : size}
      height={responsive ? undefined : size}
      style={responsive ? { width: '100%', maxWidth: size, height: 'auto' } : undefined}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={0} cy={0} r={radiusM} />
        </clipPath>
      </defs>
      <circle cx={0} cy={0} r={radiusM} fill="none" stroke="var(--rule)" style={{ strokeWidth }} />

      {/* The shared network first and receded, so the ink sits on top of it
          rather than beside it — the figure is an overlay, not a comparison. */}
      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="var(--rule)"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeWidth }}
      >
        {shared.map((d, index) => (d === '' ? null : <path key={index} d={d} />))}
      </g>

      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeWidth }}
      >
        {added.map((d, index) =>
          d === '' ? null : (
            <path key={index} d={d} pathLength={1} className={animate ? 'network-ink' : undefined} />
          ),
        )}
      </g>
    </svg>
  )
}
