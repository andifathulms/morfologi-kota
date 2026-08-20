import Link from 'next/link'
import type { ManifestEntry } from '@/data/sites'
import { NetworkDrawing } from '@/components/network/NetworkDrawing'
import { Rose } from '@/components/rose/Rose'
import { MetricColumn } from '@/components/metrics/MetricColumn'
import { CoverageBadge } from '@/components/metrics/CoverageBadge'
import { RoseTable } from '@/components/table/RoseTable'
import { SITE_TYPE_LABEL, d, t, type Locale } from '@/lib/i18n'
import type { Mode } from '@/lib/tags'

/**
 * One card of the plate: the network drawing, the rose, and the metric column
 * (PRD §6.1).
 *
 * Every card carries its sampling radius and its coverage confidence, printed
 * rather than tucked into a tooltip (DESIGN.md §6, §9). The card shows the
 * driving network by default and links to the pair, which is where the product
 * actually is.
 */
export function SiteCard({
  entry,
  geometry,
  locale,
  mode = 'drive',
}: {
  readonly entry: ManifestEntry
  readonly geometry: readonly (readonly (readonly [number, number])[])[]
  readonly locale: Locale
  readonly mode?: Mode
}) {
  const metrics = mode === 'drive' ? entry.drive : entry.walk

  return (
    <article className="flex flex-col gap-3 border border-rule-strong p-4">
      <header>
        {/* An h3: the card sits inside the plate, which has its own h2. As an
            h2 the sixteen cards were siblings of the introduction's sections,
            so the outline ran from the last paragraph of prose straight into
            an unannounced list of place names. */}
        <h3 className="m-0 font-serif text-md font-semibold leading-tight">
          <Link href={`/${locale}/lokasi/${entry.slug}`} className="no-underline">
            {entry.name}
          </Link>
        </h3>
        <p className="m-0 font-sans text-xs text-ink-subtle">
          {entry.city} · {t(SITE_TYPE_LABEL[entry.type] ?? { id: entry.type, en: entry.type }, locale)}
        </p>
      </header>

      <NetworkDrawing
        geometry={geometry}
        radiusM={entry.radiusM}
        size={320}
        responsive
        mode={mode}
        label={`${entry.name} — ${d(mode === 'drive' ? 'drive' : 'walk', locale)}`}
      />

      <div className="flex flex-wrap items-start gap-4">
        <Rose
          locale={locale}
          size={160}
          method={false}
          series={[
            {
              shares: entry.drive.rose.shares,
              mode: 'drive',
              orientationEntropy: entry.drive.orientationEntropy,
              orientationOrder: entry.drive.orientationOrder,
            },
            {
              shares: entry.walk.rose.shares,
              mode: 'walk',
              orientationEntropy: entry.walk.orientationEntropy,
              orientationOrder: entry.walk.orientationOrder,
            },
          ]}
        />
      </div>

      <MetricColumn metrics={metrics} mode={mode} locale={locale} />

      {/* DESIGN.md §10 — every rose has a table equivalent, always available.
          Collapsed so it does not crowd the plate, present so it is never a
          fallback: it is also what someone would paste into a message. */}
      <RoseTable
        locale={locale}
        label={entry.name}
        series={[
          {
            mode: 'drive',
            shares: entry.drive.rose.shares,
            binContributions: entry.drive.rose.binContributions,
            orientationEntropy: entry.drive.orientationEntropy,
          },
          {
            mode: 'walk',
            shares: entry.walk.rose.shares,
            binContributions: entry.walk.rose.binContributions,
            orientationEntropy: entry.walk.orientationEntropy,
          },
        ]}
      />

      {/* DESIGN.md §7 — 14px is captions, units and citations. This is a
          sentence about the place, so it is body size. */}
      <p className="m-0 max-w-prose font-serif text-base leading-snug text-ink-muted">
        {t(entry.note, locale)}
      </p>

      {/* DESIGN.md §9 — the legend contract, on every card. */}
      <footer className="tabular border-t border-rule-strong pt-2 font-mono text-xs">
        <p className="m-0">
          {d('radius', locale)} {entry.radiusM} m · 36 bin
        </p>
        <CoverageBadge coverage={entry.coverage} locale={locale} />
        {/* Named with the site. Sixteen cards each carried the same link text,
            which reads fine inside a card and is useless in the links list
            many readers navigate by. WCAG 2.4.9. */}
        <p className="mt-1">
          <Link href={`/${locale}/lokasi/${entry.slug}`}>
            {d('openPair', locale)} — {entry.name}
          </Link>
        </p>
      </footer>
    </article>
  )
}
