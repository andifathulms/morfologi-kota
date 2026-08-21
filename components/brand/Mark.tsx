/**
 * The mark — "Simpang".
 *
 * A trunk forking into a plain branch and a knotted one: the plain fork is the
 * drivable network, the knotted fork the walkable network, and the trunk is
 * what the two modes share. It is not a picture of a map. It is a picture of
 * the claim, which is why it survives being 20 px wide in a masthead where a
 * disc full of streets would turn to grain.
 *
 * Drawn here rather than served as the exported file, for two reasons that are
 * both DESIGN.md.
 *
 * The exported tile has a 22% corner radius and §1 allows 2px and nothing else,
 * so the tile is dropped and the glyph stands on the sheet — which is what the
 * masthead is anyway. And the exported palette is close to this product's but
 * not it: the brand blue is #3E5C74 against `--drive` #1F4E6B, the rust
 * #A34A28 against `--walk` #A3431F, the ground #F4F0E6 against `--plate`
 * #F7F4EC. Close enough to look like a mistake rather than a decision when the
 * two sit together on one page, and the ratios written beside the tokens in §3
 * were measured for the tokens. So the mark asks for the same three inks the
 * rest of the page asks for, and moves with them — including under
 * `prefers-contrast: more`, which the flat file could not do.
 *
 * §3 says the two hues carry the drive/walk gap and that nothing else gets a
 * colour. This is that gap, stated once at the top of the page in the same
 * assignment the legend uses and never swapped. It is the legend in miniature,
 * not decoration — and it is the only use of the hues outside a figure.
 */
export function Mark({ size = 32, className }: { readonly size?: number; readonly className?: string }) {
  return (
    <svg
      /* Cropped to the glyph. The exported master is centred in a 100-unit
         tile, so most of that box is the tile's padding. */
      viewBox="14 14 82 82"
      width={size}
      height={size}
      className={className}
      /* The site name sits beside it in text, so announcing this as well would
         read the same thing twice. */
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 92 L50 58" stroke="var(--ink)" strokeWidth={5} />
        <path d="M50 58 L26 34 M26 34 L18 18 M26 34 L34 20" stroke="var(--drive)" strokeWidth={5} />
        <path
          d="M50 58 L73 36 M73 36 L66 20 M73 36 L84 28 M84 28 L92 18 M84 28 L80 40"
          stroke="var(--walk)"
          strokeWidth={4.5}
        />
      </g>
    </svg>
  )
}
