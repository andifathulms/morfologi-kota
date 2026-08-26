import { UrlState } from '@/components/controls/UrlState'
import { d, type Locale } from '@/lib/i18n'

/**
 * The plate: small multiples, sortable by any metric (PRD §6.1).
 *
 * Sites may be *sorted*; they are never *rated* (PRD §4). Re-sorting is how a
 * pattern across the set becomes visible — it is not a league table, and no
 * position in the order is better than another.
 *
 * Sorting is done with radio inputs and generated CSS `order` rules rather
 * than in JavaScript. Three reasons, in order of weight: the cards stay server
 * components, so a thousand SVG paths per site never cross a client boundary
 * and never enter the hydration payload; re-sorting is then a state change of
 * the browser's own, at the 240 ms the house layer specifies; and the plate
 * works with JavaScript off, which for a page that is fundamentally a printed
 * figure is the right behaviour rather than a concession.
 *
 * The ordering rules go through `:has()` so that the radios can live inside
 * the fieldset. They used to be siblings *before* it, because `~` needs them
 * to precede the grid — which meant the legend named nothing and a screen
 * reader announced eleven radio buttons belonging to no group at all. `:has()`
 * asks the DOM rather than the sibling order, so the markup is free to be
 * correct. Still no JavaScript, still works with scripting off.
 *
 * Known ceiling, and it is not fixable here: `order` moves the cards visually
 * and leaves the DOM alone, so reading and focus order stay alphabetical after
 * a re-sort, and nothing announces that anything changed. That needs the order
 * computed into the markup — URL state and a server-rendered order.
 *
 * ## The control is a control, not a tag cloud
 *
 * Eleven chips of equal weight, wrapping to two rows, with `Nama` set exactly
 * like `ΔH — Jalan kaki − Kendara`: sorting is the plate's main verb and it
 * looked like a list of labels somebody had run out of room for. It is now
 * three named groups — what the site *is*, a figure *per mode*, and the *gap*
 * between the two modes — which is the only distinction that matters when
 * choosing one, since the third group is the product's subject and the first
 * is not a measurement at all.
 *
 * Direction is its own control rather than a property of each metric that a
 * reader cannot see. Every metric starts largest-first and the name starts
 * A–Z, because that is what each is usually read for; reversing is one chip
 * and it says so.
 *
 * Density is the honest answer to a card that is taller than it is wide.
 * Nothing is hidden by default and nothing is removed from the document: the
 * reader chooses how much of each card to draw, from the full figure down to
 * a contact sheet of discs. The rose table stays reachable in every mode
 * (DESIGN.md §10) — it is one line of summary text and it is never the thing
 * a density mode drops.
 */

export interface SortableSite {
  readonly slug: string
  readonly name: string
  readonly values: Readonly<Record<string, number>>
}

/**
 * Which of the three questions a sort answers: what the site is, what one
 * network measures, or what the two networks differ by.
 */
export type SortGroup = 'identity' | 'mode' | 'gap'

export interface SortOption {
  readonly key: string
  readonly label: string
  /** Larger first is the natural reading for most of these. */
  readonly descending: boolean
  readonly group: SortGroup
}

const NAME_KEY = 'name'
const GROUPS: readonly SortGroup[] = ['identity', 'mode', 'gap']

/** As listed, or reversed. Both are orders; neither is a ranking. */
const ORDERS = ['awal', 'balik'] as const
type Order = (typeof ORDERS)[number]

/** How much of each card is drawn. Full, without the columns, or discs only. */
const DENSITIES = ['penuh', 'ringkas', 'kontak'] as const
type Density = (typeof DENSITIES)[number]

function groupLabel(group: SortGroup, locale: Locale): string {
  switch (group) {
    case 'identity':
      return d('sortGroupIdentity', locale)
    case 'mode':
      return d('sortGroupMode', locale)
    case 'gap':
      return d('sortGroupGap', locale)
    default: {
      const never: never = group
      throw new Error(`unknown sort group: ${String(never)}`)
    }
  }
}

function orderLabel(order: Order, locale: Locale): string {
  return order === 'awal' ? d('orderAsListed', locale) : d('orderReversed', locale)
}

function densityLabel(density: Density, locale: Locale): string {
  switch (density) {
    case 'penuh':
      return d('densityFull', locale)
    case 'ringkas':
      return d('densityCompact', locale)
    case 'kontak':
      return d('densityContact', locale)
    default: {
      const never: never = density
      throw new Error(`unknown density: ${String(never)}`)
    }
  }
}

function orderFor(
  sites: readonly SortableSite[],
  option: SortOption | undefined,
  locale: Locale,
  reversed: boolean,
): Map<string, number> {
  const descending = option === undefined ? false : option.descending !== reversed
  const sorted = [...sites].sort((a, b) => {
    if (option === undefined) {
      const byName = a.name.localeCompare(b.name, locale)
      return reversed ? -byName : byName
    }
    const left = a.values[option.key] ?? 0
    const right = b.values[option.key] ?? 0
    if (left === right) return a.name.localeCompare(b.name, locale)
    return descending ? right - left : left - right
  })
  const positions = new Map<string, number>()
  sorted.forEach((site, index) => positions.set(site.slug, index))
  return positions
}

/** The radios for one group, followed by the chips they drive. */
function ChipGroup({
  legend,
  name,
  idPrefix,
  items,
  checked,
}: {
  readonly legend: string
  readonly name: string
  readonly idPrefix: string
  readonly items: readonly { key: string; label: string }[]
  readonly checked: string
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="p-0 font-mono text-2xs uppercase tracking-wide text-ink-subtle">
        {legend}
      </legend>
      {/* Inside the fieldset, before the chips: `~` needs them to precede the
          labels they highlight, and the legend needs them to be its own. */}
      {items.map((item) => (
        <input
          key={item.key}
          type="radio"
          name={name}
          id={`${idPrefix}${item.key}`}
          defaultChecked={item.key === checked}
          className="sr-only"
        />
      ))}
      <div className="plate-chips mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <label
            key={item.key}
            htmlFor={`${idPrefix}${item.key}`}
            className="cursor-pointer border border-rule-strong px-2 py-1 font-mono text-xs transition-colors duration-fast ease-house"
          >
            {item.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function PlateGrid({
  sites,
  options,
  children,
  locale,
  sortLabel,
  nameLabel,
  note,
  sheetLegend,
}: {
  readonly sites: readonly SortableSite[]
  readonly options: readonly SortOption[]
  readonly children: readonly React.ReactNode[]
  readonly locale: Locale
  readonly sortLabel: string
  readonly nameLabel: string
  /** One line saying what re-sorting is for, and that it is not a ranking. */
  readonly note?: string
  /**
   * The line the contact sheet is captioned with. It carries the radius the
   * cards stop printing in that mode, so the parameter is stated once for one
   * figure rather than sixteen times inside it (DESIGN.md §6, §9).
   */
  readonly sheetLegend?: string
}) {
  const all: SortOption[] = [
    { key: NAME_KEY, label: nameLabel, descending: false, group: 'identity' },
    ...options,
  ]

  /*
   * Every ordering, twice: as listed and reversed.
   *
   * That is two rules per site per metric — a few hundred selectors, tens of
   * kilobytes, and it is the price of the whole control working with no
   * script. CSS cannot derive the reversed position from the forward one, so
   * the alternative is not a cleverer stylesheet but a client component and a
   * thousand SVG paths crossing the hydration boundary, which is the trade
   * this page has already refused once.
   */
  const orderRules = all.flatMap((option) =>
    ORDERS.flatMap((order) => {
      const positions = orderFor(
        sites,
        option.key === NAME_KEY ? undefined : option,
        locale,
        order === 'balik',
      )
      return [...positions.entries()].map(
        ([slug, position]) =>
          `.plate:has(#sort-${option.key}:checked):has(#order-${order}:checked) .plate-grid>[data-slug="${slug}"]{order:${position}}`,
      )
    }),
  )

  /* The chips are siblings of their own radios, so these stay on `~`. */
  const chipRules = [
    ...all.map((option) => `sort-${option.key}`),
    ...ORDERS.map((order) => `order-${order}`),
    ...DENSITIES.map((density) => `density-${density}`),
  ].flatMap((id) => [
    `#${id}:checked~.plate-chips label[for="${id}"]{background:var(--ink);color:var(--plate)}`,
    `#${id}:focus-visible~.plate-chips label[for="${id}"]{outline:3px solid var(--ink);outline-offset:2px}`,
  ])

  /*
   * Density.
   *
   * `ringkas` drops the metric column and the note — the apparatus — and keeps
   * the drawing, the rose and its numbers. `kontak` keeps the drawing alone,
   * at six to a row: the literal promise of small multiples, which this plate
   * has never actually been able to keep at any scroll position.
   *
   * The rose table survives both. It is the one element §10 forbids making a
   * fallback, and a density control that quietly dropped it would be exactly
   * that with a friendlier name.
   */
  const densityRules = [
    `.plate:has(#density-ringkas:checked) [data-card="metrics"],`,
    `.plate:has(#density-ringkas:checked) [data-card="note"]{display:none}`,
    `.plate:has(#density-kontak:checked) [data-card="metrics"],`,
    `.plate:has(#density-kontak:checked) [data-card="note"],`,
    `.plate:has(#density-kontak:checked) [data-card="rose"],`,
    `.plate:has(#density-kontak:checked) [data-card="footer"]{display:none}`,
    /* The radius leaves the card and is stated once for the sheet — see the
       legend rendered above the grid, and DESIGN.md §6. */
    `.plate [data-sheet-legend]{display:none}`,
    `.plate:has(#density-kontak:checked) [data-sheet-legend]{display:block}`,
    `@media (min-width:768px){.plate:has(#density-kontak:checked) .plate-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}`,
    `@media (min-width:1280px){.plate:has(#density-kontak:checked) .plate-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}`,
  ].join('')

  /*
   * The sweep across small multiples, finally working.
   *
   * Every ruler draws a tick for every site, so a site has a tick on sixteen
   * cards. Hovering or focusing one card lights that site's tick on all of
   * them, which is the comparison across the set that a grid of separate
   * figures cannot otherwise make: where does this place sit, on every other
   * place's scale, at once.
   *
   * Still no script. `:has()` asks the DOM, and the highlight is a 120 ms
   * state change like every other hover in the product (DESIGN.md §8).
   */
  const highlightRules = sites.flatMap((site) => [
    `.plate:has([data-slug="${site.slug}"]:hover) [data-tick="${site.slug}"],`,
    `.plate:has([data-slug="${site.slug}"]:focus-within) [data-tick="${site.slug}"]{stroke:var(--ink);stroke-width:2.5}`,
  ])

  /*
   * Which metric the plate is ordered by, said on the cards.
   *
   * The chip is at the top of the page and the cards are three screens below
   * it, so a reader scrolling the grid had no way to remember what they were
   * looking at an ordering of. The figure that produced the order takes a
   * neutral band from the palette — `--rule-faint`, no hue, nothing that
   * could be read as a grade (§3) — on the card that carries it.
   *
   * `name` is not a metric and marks nothing: the alphabet is not a finding.
   */
  const sortedMarkRules = all
    .filter((option) => option.key !== NAME_KEY)
    .flatMap((option) => [
      `.plate:has(#sort-${option.key}:checked) [data-metric="${option.key}"]{background:var(--rule-faint);box-shadow:0 0 0 2px var(--rule-faint)}`,
    ])

  const rules =
    [...orderRules, ...chipRules, ...highlightRules, ...sortedMarkRules].join('') + densityRules

  return (
    <div className="plate">
      <style dangerouslySetInnerHTML={{ __html: rules }} />

      {/*
        The control announces itself as a control. It used to open with a
        legend set in the same size and weight as body prose, immediately above
        ten chips reading `φ — Kendara` and `ΔH — Jalan kaki − Kendara`, which
        is the first thing many readers met on the page. The note says what
        re-sorting is for before the jargon arrives — and says the thing the
        source comment has always said and the page never did (PRD §4).
      */}
      <fieldset className="plate-controls m-0 mb-6 border-0 p-0">
        <legend className="p-0 font-sans text-base font-semibold">{sortLabel}</legend>
        {note !== undefined ? (
          <p className="m-0 mb-4 mt-1 max-w-prose font-sans text-base leading-note text-ink-subtle">
            {note}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {GROUPS.map((group) => {
            const items = all.filter((option) => option.group === group)
            if (items.length === 0) return null
            return (
              <ChipGroup
                key={group}
                legend={groupLabel(group, locale)}
                name="plate-sort"
                idPrefix="sort-"
                checked={NAME_KEY}
                items={items.map((option) => ({ key: option.key, label: option.label }))}
              />
            )
          })}

          <ChipGroup
            legend={d('orderHeading', locale)}
            name="plate-order"
            idPrefix="order-"
            checked="awal"
            items={ORDERS.map((order) => ({ key: order, label: orderLabel(order, locale) }))}
          />

          <ChipGroup
            legend={d('densityHeading', locale)}
            name="plate-density"
            idPrefix="density-"
            checked="penuh"
            items={DENSITIES.map((density) => ({
              key: density,
              label: densityLabel(density, locale),
            }))}
          />
        </div>

        <p className="m-0 mt-3 max-w-prose font-sans text-base leading-note text-ink-subtle">
          {d('controlNote', locale)}
        </p>
      </fieldset>

      {/* After the radios, before the grid: the radio is set before a single
          card has parsed, so a shared link opens already sorted rather than
          re-sorting in front of the reader. */}
      <UrlState
        param="urut"
        name="plate-sort"
        idPrefix="sort-"
        keys={all.map((option) => option.key)}
        defaultKey={NAME_KEY}
      />
      <UrlState
        param="arah"
        name="plate-order"
        idPrefix="order-"
        keys={[...ORDERS]}
        defaultKey="awal"
      />
      <UrlState
        param="rapat"
        name="plate-density"
        idPrefix="density-"
        keys={[...DENSITIES]}
        defaultKey="penuh"
      />

      {/*
        Rows are further apart than columns, and deliberately so. The cards
        lost their boxes when the plate was set (DESIGN.md §6): what separates
        one from the next is now the rule across its top, and a rule needs
        white space above it to read as the start of something rather than as
        the underside of the card before it.
      */}
      {sheetLegend === undefined ? null : (
        <p data-sheet-legend className="tabular mb-4 font-mono text-xs">
          {sheetLegend}
        </p>
      )}

      <div className="plate-grid grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-4">
        {children.map((child, index) => {
          const site = sites[index]
          return (
            <div key={site?.slug ?? index} data-slug={site?.slug}>
              {child}
            </div>
          )
        })}
      </div>
    </div>
  )
}
