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
          `#sort-${option.key}:checked~.plate-grid>[data-slug="${slug}"]{order:${position}}`,
      )
      return [
        ...orderRules,
        `#sort-${option.key}:checked~.plate-controls label[for="sort-${option.key}"]{background:var(--ink);color:var(--plate)}`,
        `#sort-${option.key}:focus-visible~.plate-controls label[for="sort-${option.key}"]{outline:3px solid var(--ink);outline-offset:2px}`,
      ]
    })
    .join('')

  return (
    <div className="plate">
      <style dangerouslySetInnerHTML={{ __html: rules }} />

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
        <div className="flex flex-wrap gap-2">
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
