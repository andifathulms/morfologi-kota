import type { SiteBundle } from '@/data/sites'
import { NetworkDifferenceDrawing, NetworkDrawing } from '@/components/network/NetworkDrawing'
import { Rose } from '@/components/rose/Rose'
import type { ModeMetrics } from '@/lib/morphology'
import { WorkingColumn } from '@/components/metrics/WorkingColumn'
import { RoseTable } from '@/components/table/RoseTable'
import { ModeSwatch } from '@/components/legend/ModeKey'
import { ComparisonTable } from '@/components/pair/ComparisonTable'
import { d, type Locale } from '@/lib/i18n'
import { fixed, kilometres, percent, signed, signedPercent } from '@/lib/format'

/**
 * The pair — the reason the project exists (PRD §6.2).
 *
 * Drive on the left, walk on the right, the delta between them. Never stacked
 * vertically on desktop: the comparison has to be side by side to read as a
 * comparison (DESIGN.md §6). On a narrow screen the two panes become a
 * horizontal swipe with the delta pinned beneath, because side by side is
 * unreadable at that width — done with scroll snapping, so it costs nothing
 * and works without script.
 *
 * ## Set as a spread (DESIGN.md §6b), since the 2026 pass
 *
 * The opening is the two discs at the width of their columns and the gap at
 * headline size between them — +23.7 km is the finding for a site, and it
 * was a row in a table. The three metric columns became one comparison
 * table: every metric named once, both modes and their difference side by
 * side, and each placed in the set. The notes those columns each printed —
 * H's unit, circuity's sampling, the rose's weighting — are stated once,
 * under the table.
 */
export function PairView({
  bundle,
  locale,
  set,
}: {
  readonly bundle: SiteBundle
  readonly locale: Locale
  /** Every site in the set, both modes — what the comparison table places this one in. */
  readonly set: readonly { readonly slug: string; readonly drive: ModeMetrics; readonly walk: ModeMetrics }[]
}) {
  const { drive, walk, radiusM } = bundle

  const driveRose = {
    shares: drive.metrics.rose.shares,
    kind: 'drive' as const,
    orientationEntropy: drive.metrics.orientationEntropy,
    orientationOrder: drive.metrics.orientationOrder,
  }
  const walkRose = {
    shares: walk.metrics.rose.shares,
    kind: 'walk' as const,
    orientationEntropy: walk.metrics.orientationEntropy,
    orientationOrder: walk.metrics.orientationOrder,
  }

  /*
   * The gap, at the size of the finding it is. Walk minus drive, signs kept,
   * in ink: it belongs to neither mode, and a diverging colour here would
   * smuggle in the ranking PRD §4 forbids.
   */
  const gaps: readonly { value: string; label: string }[] = [
    {
      value: signed(walk.metrics.intersectionDensityPerKm2 - drive.metrics.intersectionDensityPerKm2, 0),
      label: locale === 'id' ? 'simpang per km²' : 'intersections per km²',
    },
    {
      value: signedPercent(
        walk.metrics.degrees.proportions.deadEnd - drive.metrics.degrees.proportions.deadEnd,
      ),
      label: d('deadEnd', locale),
    },
    {
      value: signed(walk.metrics.orientationEntropy - drive.metrics.orientationEntropy, 3),
      label: locale === 'id' ? 'ΔH · entropi orientasi' : 'ΔH · orientation entropy',
    },
  ]

  const delta = (
    <div className="text-center">
      <p className="m-0 font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
        {d('delta', locale)}
      </p>
      <p className="tabular m-0 mt-3 font-mono text-3xl leading-none tracking-display">
        +{fixed(bundle.walkOnly.lengthM / 1000, 1)}
      </p>
      <p className="m-0 mt-2 font-sans text-xs leading-note text-ink-muted">
        {locale === 'id'
          ? `km jaringan hanya bagi pejalan kaki · ${percent(bundle.walkOnly.shareOfWalk)} dari jaringan jalan kaki`
          : `km of network reachable only on foot · ${percent(bundle.walkOnly.shareOfWalk)} of the walking network`}
      </p>
      <dl className="tabular m-0 mt-4">
        {gaps.map((gap) => (
          <div key={gap.label} className="border-t border-rule-strong py-3">
            <dd className="m-0 font-mono text-lg leading-none">{gap.value}</dd>
            <dt className="mt-1 font-sans text-xs text-ink-subtle">{gap.label}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex flex-col items-center border-t border-rule-strong pt-4">
        <p className="m-0 font-sans text-xs text-ink-subtle">
          {locale === 'id' ? 'Kedua rose ditumpuk' : 'Both roses overlaid'}
        </p>
        <Rose locale={locale} size={200} method={false} series={[driveRose, walkRose]} />
        {/* The overprint needs its key wherever the overlay appears. */}
        <ul className="m-0 mt-1 flex list-none flex-wrap justify-center gap-x-3 gap-y-1 p-0 font-sans text-xs">
          {(['drive', 'walk', 'both'] as const).map((swatch) => (
            <li key={swatch} className="flex items-center gap-1">
              <ModeSwatch mode={swatch} />
              {swatch === 'both' ? d('keyBoth', locale) : d(swatch, locale)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  const pane = (mode: 'drive' | 'walk') => {
    const data = mode === 'drive' ? drive : walk
    return (
      <section
        className={`w-pane min-w-pane shrink-0 snap-center md:row-start-1 md:w-auto md:min-w-0 ${
          mode === 'drive' ? 'md:col-start-1' : 'md:col-start-3'
        }`}
      >
        <h2 className="m-0 flex items-center gap-3 font-serif text-xl font-medium tracking-heading">
          <ModeSwatch mode={mode} />
          <span style={{ color: `var(--${mode})` }}>{d(mode, locale)}</span>
        </h2>
        <p className="tabular m-0 mt-1 font-mono text-xs text-ink-subtle">
          {kilometres(data.metrics.totalLengthM)} ·{' '}
          {fixed(data.metrics.intersectionDensityPerKm2, 0)}{' '}
          {locale === 'id' ? 'simpang/km²' : 'intersections/km²'}
        </p>
        {/* A numbered figure, because this page's figures are fixed and a
            reader who wants to point at one has nothing else to point with
            (DESIGN.md §6b). The plate's cards stay unnumbered: they re-sort. */}
        <figure className="m-0 mt-4">
          <NetworkDrawing
            geometry={data.geometry}
            radiusM={radiusM}
            size={560}
            responsive
            label={`${bundle.site.name} — ${d(mode, locale)}`}
          />
          <figcaption className="mt-2 max-w-prose font-sans text-base leading-note text-ink-muted">
            <span className="font-mono text-xs">
              {d('figureAbbrev', locale)} {mode === 'drive' ? 1 : 2} · r = {radiusM} m
            </span>{' '}
            — {d(mode === 'drive' ? 'figureDriveCaption' : 'figureWalkCaption', locale)}
          </figcaption>
        </figure>
        <div className="mt-6">
          <Rose locale={locale} size={200} method={false} series={[mode === 'drive' ? driveRose : walkRose]} />
        </div>
      </section>
    )
  }

  return (
    <div>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)_minmax(0,1fr)] md:items-start md:gap-8 lg:gap-12">
        {/*
          `md:contents` is what lets the delta exist once: the panes become
          direct children of the grid and the delta is placed into the middle
          column from a DOM position that also reads correctly beneath them on
          a phone. Focusable, because below `md` this is a horizontal scroller
          with nothing inside to tab to; `role="group"` and a name because
          there is no native element for a scrollable region.
        */}
        <div
          tabIndex={0}
          role="group"
          aria-label={d('pairPanes', locale)}
          className="pair-panes flex snap-x snap-mandatory gap-8 overflow-x-auto border-b border-rule-strong pb-4 md:contents"
        >
          {pane('drive')}
          {pane('walk')}
        </div>

        <div className="mt-6 md:col-start-2 md:row-start-1 md:mt-16">{delta}</div>
      </div>

      <section className="mt-16 border-t border-rule-strong pt-8" aria-labelledby="dua-pembacaan">
        <h2 id="dua-pembacaan" className="m-0 font-serif text-xl font-medium tracking-heading">
          {locale === 'id' ? 'Dua pembacaan, satu tabel' : 'Two readings, one table'}
        </h2>
        <p className="m-0 mt-2 max-w-prose font-sans text-base leading-note text-ink-muted">
          {locale === 'id'
            ? 'Garis tipis: setiap lokasi dalam set, kedua moda. Tanda: lokasi ini. Posisi, bukan nilai — tidak ada ujung yang lebih baik.'
            : 'Hairlines: every site in the set, both modes. Marks: this site. A position, not a value — neither end is better.'}
        </p>
        <div className="mt-4 overflow-x-auto">
          <ComparisonTable
            drive={drive.metrics}
            walk={walk.metrics}
            set={set}
            locale={locale}
            label={bundle.site.name}
          />
        </div>
        {/* The notes each metric column used to print under itself, once. */}
        <div className="mt-6 grid max-w-figure gap-3 font-sans text-base leading-note text-ink-muted">
          <p className="m-0">{d('natNote', locale)}</p>
          <p className="m-0">
            {d('circuitySampled', locale)}{' '}
            {([['drive', drive.metrics], ['walk', walk.metrics]] as const).map(([mode, metrics]) => (
              <span key={mode} className="tabular mr-2 font-mono text-xs">
                {d(mode, locale)}: {metrics.sampledPairCount} {d('sampledPairs', locale)}
                {metrics.unreachablePairCount > 0
                  ? ` · ${metrics.unreachablePairCount} ${d('unreachablePairs', locale)}`
                  : ''}
                .
              </span>
            ))}{' '}
            {drive.metrics.unreachablePairCount > 0 || walk.metrics.unreachablePairCount > 0
              ? d('unreachableNote', locale)
              : null}
          </p>
          <p className="m-0">
            {d('roseMethod', locale)} {d('roseSymmetryNote', locale)}{' '}
            <span className="font-mono text-xs">Boeing 2019 §3</span>
          </p>
        </div>
      </section>

      {/*
        The difference, drawn. Two discs side by side ask the reader to
        subtract by eye, and they do not; this is the same subtraction
        rendered, so a fine mesh through a kampung and two cut-throughs at the
        edge of a cluster stop looking like the same finding.
      */}
      <section className="mt-16 border-t border-rule-strong pt-8">
        <figure className="m-0 md:grid md:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] md:items-center md:gap-12">
          <div>
            <NetworkDifferenceDrawing
              geometry={walk.geometry}
              walkOnlyIndices={bundle.walkOnly.indices}
              radiusM={radiusM}
              size={520}
              responsive
              label={`${bundle.site.name} — ${d('differenceHeading', locale)}`}
            />
          </div>
          <div className="mt-4 md:mt-0">
            <p className="m-0 font-mono text-xs text-ink-subtle">
              {d('figureAbbrev', locale)} 3 · r = {radiusM} m
            </p>
            {/* An h2: the difference is a peer of the two networks it is
                derived from, not a subsection of either. */}
            <h2 className="m-0 mt-1 font-serif text-xl font-medium tracking-heading">
              {d('differenceHeading', locale)}
            </h2>
            <figcaption className="mt-3 max-w-prose font-serif text-md leading-prose text-ink-muted">
              {d('differenceCaption', locale)}
            </figcaption>
            <dl className="tabular m-0 mt-4 grid max-w-sm grid-cols-[1fr_auto] gap-x-4 text-xs">
              <dt className="border-b border-rule-faint py-1 font-sans text-ink-muted">
                {d('walkOnlyLength', locale)}
              </dt>
              <dd className="m-0 border-b border-rule-faint py-1 text-right font-mono">
                {kilometres(bundle.walkOnly.lengthM)}
              </dd>
              <dt className="border-b border-rule-faint py-1 font-sans text-ink-muted">
                {d('walkOnlyShare', locale)}
              </dt>
              <dd className="m-0 border-b border-rule-faint py-1 text-right font-mono">
                {percent(bundle.walkOnly.shareOfWalk)}
              </dd>
            </dl>
          </div>
        </figure>
      </section>

      <section className="mt-16 border-t border-rule-strong pt-8" aria-labelledby="asal-angka">
        <h2 id="asal-angka" className="m-0 font-serif text-xl font-medium tracking-heading">
          {locale === 'id' ? 'Dari mana angka-angka ini' : 'Where these numbers come from'}
        </h2>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <WorkingColumn metrics={drive.metrics} mode="drive" radiusM={radiusM} locale={locale} paired />
          <WorkingColumn metrics={walk.metrics} mode="walk" radiusM={radiusM} locale={locale} paired />
        </div>
        <p className="mt-4 max-w-prose font-sans text-base leading-note text-ink-muted">
          {d('workingNote', locale)} {d('edgeCircuityNote', locale)}
        </p>
      </section>

      <div className="mt-8">
        <RoseTable
          locale={locale}
          label={bundle.site.name}
          series={[
            {
              mode: 'drive',
              shares: drive.metrics.rose.shares,
              binContributions: drive.metrics.rose.binContributions,
              orientationEntropy: drive.metrics.orientationEntropy,
            },
            {
              mode: 'walk',
              shares: walk.metrics.rose.shares,
              binContributions: walk.metrics.rose.binContributions,
              orientationEntropy: walk.metrics.orientationEntropy,
            },
          ]}
        />
      </div>
    </div>
  )
}
