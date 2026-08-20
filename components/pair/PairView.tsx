import type { SiteBundle } from '@/data/sites'
import { NetworkDifferenceDrawing, NetworkDrawing } from '@/components/network/NetworkDrawing'
import { Rose } from '@/components/rose/Rose'
import { MetricColumn } from '@/components/metrics/MetricColumn'
import { DeltaColumn } from '@/components/metrics/DeltaColumn'
import { RoseTable } from '@/components/table/RoseTable'
import { d, type Locale } from '@/lib/i18n'
import { kilometres, percent } from '@/lib/format'

/**
 * The pair — the reason the project exists (PRD §6.2).
 *
 * Drive on the left, walk on the right, the delta between them. Never stacked
 * vertically on desktop: the comparison has to be side by side to read as a
 * comparison (DESIGN.md §6). On a narrow screen the two panes become a
 * horizontal swipe with the delta pinned beneath, because side by side is
 * unreadable at that width — done with scroll snapping, so it costs nothing
 * and works without script.
 */
export function PairView({ bundle, locale }: { readonly bundle: SiteBundle; readonly locale: Locale }) {
  const { drive, walk, radiusM } = bundle

  const driveRose = {
    shares: drive.metrics.rose.shares,
    mode: 'drive' as const,
    orientationEntropy: drive.metrics.orientationEntropy,
    orientationOrder: drive.metrics.orientationOrder,
  }
  const walkRose = {
    shares: walk.metrics.rose.shares,
    mode: 'walk' as const,
    orientationEntropy: walk.metrics.orientationEntropy,
    orientationOrder: walk.metrics.orientationOrder,
  }

  const delta = (
    <div>
      <div className="mb-4">
        <p className="m-0 font-sans text-xs text-ink-subtle">
          {locale === 'id' ? 'Kedua rose ditumpuk' : 'Both roses overlaid'}
        </p>
        <Rose locale={locale} size={200} series={[driveRose, walkRose]} />
      </div>
      <DeltaColumn drive={drive.metrics} walk={walk.metrics} locale={locale} />
    </div>
  )

  /*
   * The difference, drawn.
   *
   * Two discs side by side ask the reader to subtract by eye, and they do not:
   * they read the Δ column, which is a scalar. This is the same subtraction
   * rendered, so that a fine mesh through a kampung and two cut-throughs at
   * the edge of a cluster stop looking like the same finding.
   */
  const difference = (
    <figure className="m-0">
      {/*
        An h2, not an h3: the difference is a peer of the two columns it is
        derived from, not a subsection of the walking one. As an h3 the
        document outline filed the product's central figure underneath "walk".
      */}
      <h2 className="m-0 font-sans text-lg font-semibold">{d('differenceHeading', locale)}</h2>
      <div className="mt-2">
        <NetworkDifferenceDrawing
          geometry={walk.geometry}
          walkOnlyIndices={bundle.walkOnly.indices}
          radiusM={radiusM}
          size={420}
          responsive
          label={`${bundle.site.name} — ${d('differenceHeading', locale)}`}
        />
      </div>
      <dl className="tabular m-0 mt-2 grid grid-cols-[1fr_auto] gap-x-4 font-mono text-xs">
        <dt className="border-b border-rule-faint py-px text-ink-subtle">
          {d('walkOnlyLength', locale)}
        </dt>
        <dd className="m-0 border-b border-rule-faint py-px text-right">
          {kilometres(bundle.walkOnly.lengthM)}
        </dd>
        <dt className="border-b border-rule-faint py-px text-ink-subtle">
          {d('walkOnlyShare', locale)}
        </dt>
        <dd className="m-0 border-b border-rule-faint py-px text-right">
          {percent(bundle.walkOnly.shareOfWalk)}
        </dd>
      </dl>
      <figcaption className="mt-2 max-w-prose font-sans text-base leading-snug text-ink-muted">
        {d('differenceCaption', locale)}
      </figcaption>
    </figure>
  )

  return (
    <div>
      {/*
        Focusable, because below `md` this is a horizontal scroller and there
        is nothing inside either pane to tab to — the drawings and roses are
        images, the metric columns are description lists. Without a focus stop
        the walking pane was unreachable without a pointer, which also caught
        anyone at 200% zoom on a 1280 px screen.

        `role="group"` and a name because there is no native element for a
        scrollable region: tabIndex alone would add a focus stop that announces
        nothing at all.
      */}
      <div
        tabIndex={0}
        role="group"
        aria-label={d('pairPanes', locale)}
        className="flex snap-x snap-mandatory gap-8 overflow-x-auto pb-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-6 md:overflow-visible md:pb-0"
      >
        <section className="min-w-pane shrink-0 snap-center md:col-start-1 md:min-w-0">
          <h2 className="m-0 font-sans text-lg font-semibold" style={{ color: 'var(--drive)' }}>
            {d('drive', locale)}
          </h2>
          <NetworkDrawing
            geometry={drive.geometry}
            radiusM={radiusM}
            size={420}
            responsive
            mode="drive"
            label={`${bundle.site.name} — ${d('drive', locale)}`}
          />
          <Rose locale={locale} size={220} series={[driveRose]} />
          <div className="mt-4">
            <MetricColumn metrics={drive.metrics} mode="drive" locale={locale} />
          </div>
        </section>

        {/* Desktop: the delta sits between the two panes, so the comparison is
            read across rather than remembered. */}
        <div className="hidden md:col-start-2 md:block md:border-x md:border-rule-strong md:px-6">
          {delta}
        </div>

        <section className="min-w-pane shrink-0 snap-center md:col-start-3 md:min-w-0">
          <h2 className="m-0 font-sans text-lg font-semibold" style={{ color: 'var(--walk)' }}>
            {d('walk', locale)}
          </h2>
          <NetworkDrawing
            geometry={walk.geometry}
            radiusM={radiusM}
            size={420}
            responsive
            mode="walk"
            label={`${bundle.site.name} — ${d('walk', locale)}`}
          />
          <Rose locale={locale} size={220} series={[walkRose]} />
          <div className="mt-4">
            <MetricColumn metrics={walk.metrics} mode="walk" locale={locale} />
          </div>
        </section>
      </div>

      {/* Narrow screens swipe between the two panes with the delta beneath. */}
      <div className="mt-6 border-t border-rule-strong pt-4 md:hidden">{delta}</div>

      <section className="mt-12 border-t border-rule-strong pt-6">{difference}</section>

      <RoseTable
        locale={locale}
        label={bundle.site.name}
        series={[
          { mode: 'drive', shares: drive.metrics.rose.shares },
          { mode: 'walk', shares: walk.metrics.rose.shares },
        ]}
      />
    </div>
  )
}
