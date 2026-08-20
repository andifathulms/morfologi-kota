import { UrlState } from '@/components/controls/UrlState'
import type { Locale } from '@/lib/i18n'

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
 */

export interface SortableSite {
  readonly slug: string
  readonly name: string
  readonly values: Readonly<Record<string, number>>
}

export interface SortOption {
  readonly key: string
  readonly label: string
  /** Larger first is the natural reading for most of these. */
  readonly descending: boolean
}

const NAME_KEY = 'name'

function orderFor(
  sites: readonly SortableSite[],
  option: SortOption | undefined,
  locale: Locale,
): Map<string, number> {
  const sorted = [...sites].sort((a, b) => {
    if (option === undefined) return a.name.localeCompare(b.name, locale)
    const left = a.values[option.key] ?? 0
    const right = b.values[option.key] ?? 0
    if (left === right) return a.name.localeCompare(b.name, locale)
    return option.descending ? right - left : left - right
  })
  const positions = new Map<string, number>()
  sorted.forEach((site, index) => positions.set(site.slug, index))
  return positions
}

export function PlateGrid({
  sites,
  options,
  children,
  locale,
  sortLabel,
  nameLabel,
  note,
}: {
  readonly sites: readonly SortableSite[]
  readonly options: readonly SortOption[]
  readonly children: readonly React.ReactNode[]
  readonly locale: Locale
  readonly sortLabel: string
  readonly nameLabel: string
  /** One line saying what re-sorting is for, and that it is not a ranking. */
  readonly note?: string
}) {
  const all: SortOption[] = [
    { key: NAME_KEY, label: nameLabel, descending: false },
    ...options,
  ]

  const rules = all
    .flatMap((option) => {
      const order = orderFor(sites, option.key === NAME_KEY ? undefined : option, locale)
      const orderRules = [...order.entries()].map(
        ([slug, position]) =>
          `.plate:has(#sort-${option.key}:checked) .plate-grid>[data-slug="${slug}"]{order:${position}}`,
      )
      // The chips are siblings of the radios inside the fieldset, so these two
      // stay on `~` — only the grid, which is outside it, needs `:has()`.
      return [
        ...orderRules,
        `#sort-${option.key}:checked~.plate-chips label[for="sort-${option.key}"]{background:var(--ink);color:var(--plate)}`,
        `#sort-${option.key}:focus-visible~.plate-chips label[for="sort-${option.key}"]{outline:3px solid var(--ink);outline-offset:2px}`,
      ]
    })
    .join('')

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
          <p className="m-0 mb-3 mt-1 max-w-prose font-sans text-base leading-snug text-ink-subtle">
            {note}
          </p>
        ) : null}
        {/* Inside the fieldset, so the legend above is their group name. */}
        {all.map((option) => (
          <input
            key={option.key}
            type="radio"
            name="plate-sort"
            id={`sort-${option.key}`}
            defaultChecked={option.key === NAME_KEY}
            className="sr-only"
          />
        ))}

        <div className="plate-chips flex flex-wrap gap-2">
          {all.map((option) => (
            <label
              key={option.key}
              htmlFor={`sort-${option.key}`}
              className="cursor-pointer border border-rule-strong px-2 py-1 font-mono text-xs transition-colors duration-fast ease-house"
            >
              {option.label}
            </label>
          ))}
        </div>
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

      <div className="plate-grid grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
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
