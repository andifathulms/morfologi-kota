import type { SiteBundle } from '@/data/sites'
import { NetworkDrawing } from '@/components/network/NetworkDrawing'
import { Rose } from '@/components/rose/Rose'
import { MetricColumn } from '@/components/metrics/MetricColumn'
import { DeltaColumn } from '@/components/metrics/DeltaColumn'
import { RoseTable } from '@/components/table/RoseTable'
import { d, type Locale } from '@/lib/i18n'

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
        <p className="m-0 font-sans text-xs text-ink/70">
          {locale === 'id' ? 'Kedua rose ditumpuk' : 'Both roses overlaid'}
        </p>
        <Rose locale={locale} size={200} series={[driveRose, walkRose]} />
      </div>
      <DeltaColumn drive={drive.metrics} walk={walk.metrics} locale={locale} />
    </div>
  )

  return (
    <div>
      <div className="flex snap-x snap-mandatory gap-8 overflow-x-auto pb-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-6 md:overflow-visible md:pb-0">
        <section className="min-w-[85vw] shrink-0 snap-center md:col-start-1 md:min-w-0">
          <h2 className="m-0 font-sans text-lg font-semibold" style={{ color: 'var(--drive)' }}>
            {d('drive', locale)}
          </h2>
          <NetworkDrawing
            geometry={drive.geometry}
            radiusM={radiusM}
            size={340}
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
        <div className="hidden md:col-start-2 md:block md:border-x md:border-rule md:px-6">
          {delta}
        </div>

        <section className="min-w-[85vw] shrink-0 snap-center md:col-start-3 md:min-w-0">
          <h2 className="m-0 font-sans text-lg font-semibold" style={{ color: 'var(--walk)' }}>
            {d('walk', locale)}
          </h2>
          <NetworkDrawing
            geometry={walk.geometry}
            radiusM={radiusM}
            size={340}
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
      <div className="mt-6 border-t border-rule pt-4 md:hidden">{delta}</div>

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
