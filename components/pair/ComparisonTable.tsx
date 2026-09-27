import type { ModeMetrics } from '@/lib/morphology'
import { d, type Locale } from '@/lib/i18n'
import { fixed, kilometres, metres, perKm2, percent, signed, signedPercent } from '@/lib/format'
import { rulerPosition, rulerRank } from '@/components/metrics/DistributionRuler'
import { ModeSwatch } from '@/components/legend/ModeKey'

/**
 * Two readings, one table (DESIGN.md §6b).
 *
 * The pair used to print three columns — ten rows for drive, ten for walk and
 * ten deltas in a narrow middle column — so every metric was named three
 * times and a reader compared across two gutters. This names each metric
 * once and sets the two modes and their difference side by side, which is the
 * comparison the page exists for and still never a vertical stack (§6).
 *
 * The last column places both values in the set: a hairline axis over the
 * observed range of every site in either mode, a solid drive square and an
 * outlined walk square. It carries the distribution ruler's guards (§6a): no
 * preferred end, no ramp, and a text equivalent that says *sorted by*.
 *
 * Nothing is computed here but the subtraction the delta column always did.
 */

interface Row {
  readonly label: string
  readonly unit?: string
  readonly value: (metrics: ModeMetrics) => number
  readonly format: (value: number) => string
  readonly formatDelta: (delta: number) => string
  readonly places: number
}

function rows(locale: Locale): readonly Row[] {
  return [
    {
      label: d('entropy', locale),
      unit: 'nat',
      value: (m) => m.orientationEntropy,
      format: (v) => fixed(v, 3),
      formatDelta: (v) => signed(v, 3),
      places: 3,
    },
    {
      label: 'H / H max',
      value: (m) => m.normalisedEntropy,
      format: (v) => fixed(v, 3),
      formatDelta: (v) => signed(v, 3),
      places: 3,
    },
    {
      label: d('phi', locale),
      value: (m) => m.orientationOrder,
      format: (v) => fixed(v, 3),
      formatDelta: (v) => signed(v, 3),
      places: 3,
    },
    {
      label: d('circuity', locale),
      unit: locale === 'id' ? 'sampel' : 'sampled',
      value: (m) => m.sampledCircuity,
      format: (v) => fixed(v, 3),
      formatDelta: (v) => signed(v, 3),
      places: 3,
    },
    {
      label: d('averageDegree', locale),
      value: (m) => m.degrees.averageDegree,
      format: (v) => fixed(v, 2),
      formatDelta: (v) => signed(v, 2),
      places: 2,
    },
    {
      label: d('fourWay', locale),
      value: (m) => m.degrees.proportions.fourWay,
      format: (v) => percent(v),
      formatDelta: (v) => signedPercent(v),
      places: 3,
    },
    {
      label: d('deadEnd', locale),
      value: (m) => m.degrees.proportions.deadEnd,
      format: (v) => percent(v),
      formatDelta: (v) => signedPercent(v),
      places: 3,
    },
    {
      label: d('intersectionDensity', locale),
      value: (m) => m.intersectionDensityPerKm2,
      format: (v) => perKm2(v),
      formatDelta: (v) => `${signed(v, 0)} /km²`,
      places: 0,
    },
    {
      label: d('medianSegment', locale),
      value: (m) => m.medianSegmentLengthM,
      format: (v) => metres(v),
      formatDelta: (v) => `${signed(v, 0)} m`,
      places: 0,
    },
    {
      label: d('totalLength', locale),
      value: (m) => m.totalLengthM,
      format: (v) => kilometres(v),
      formatDelta: (v) => `${signed(v / 1000, 1)} km`,
      places: 0,
    },
  ]
}

export function ComparisonTable({
  drive,
  walk,
  set,
  locale,
  label,
}: {
  readonly drive: ModeMetrics
  readonly walk: ModeMetrics
  /** Every site in the set, both modes — what the position column reads against. */
  readonly set: readonly { readonly slug: string; readonly drive: ModeMetrics; readonly walk: ModeMetrics }[]
  readonly locale: Locale
  readonly label: string
}) {
  return (
    <table className="compare-table tabular w-full border-collapse">
      <caption className="sr-only">
        {locale === 'id'
          ? `${label}: metrik jaringan kendara dan jaringan jalan kaki, selisihnya, dan posisinya dalam ${set.length} lokasi.`
          : `${label}: driving and walking network metrics, their difference, and their position among ${set.length} sites.`}
      </caption>
      <thead>
        <tr className="border-b border-ink">
          <th scope="col" className="py-2 pr-4 text-left font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            {locale === 'id' ? 'Metrik' : 'Metric'}
          </th>
          <th scope="col" className="py-2 pl-4 text-right font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            <span className="inline-flex items-center gap-2">
              <ModeSwatch mode="drive" />
              {d('drive', locale)}
            </span>
          </th>
          <th scope="col" className="py-2 pl-4 text-right font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            <span className="inline-flex items-center gap-2">
              <ModeSwatch mode="walk" />
              {d('walk', locale)}
            </span>
          </th>
          <th scope="col" className="py-2 pl-4 text-right font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            {d('delta', locale)}
          </th>
          <th scope="col" className="compare-col py-2 pl-6 text-left font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            {locale === 'id' ? `Posisi dalam ${set.length} lokasi` : `Position among ${set.length} sites`}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows(locale).map((row) => {
          const driveValue = row.value(drive)
          const walkValue = row.value(walk)
          const values = set.flatMap((site) => [row.value(site.drive), row.value(site.walk)])
          const min = Math.min(...values)
          const max = Math.max(...values)
          const drivePoints = set.map((site) => ({ slug: site.slug, value: row.value(site.drive) }))
          const walkPoints = set.map((site) => ({ slug: site.slug, value: row.value(site.walk) }))
          const at = (value: number) => `${rulerPosition(value, min, max).toFixed(2)}%`
          return (
            <tr key={row.label} className="border-b border-rule-faint">
              <th scope="row" className="py-2 pr-4 text-left align-middle font-sans text-base font-normal">
                {row.label}
                {row.unit === undefined ? null : (
                  <span className="ml-2 font-sans text-xs text-ink-subtle">{row.unit}</span>
                )}
              </th>
              <td className="whitespace-nowrap py-2 pl-4 text-right align-middle font-mono text-xs">
                {row.format(driveValue)}
              </td>
              <td className="whitespace-nowrap py-2 pl-4 text-right align-middle font-mono text-xs">
                {row.format(walkValue)}
              </td>
              <td className="whitespace-nowrap py-2 pl-4 text-right align-middle font-mono text-xs font-semibold">
                {row.formatDelta(walkValue - driveValue)}
              </td>
              <td className="py-2 pl-6 align-middle">
                <span className="gap-track compare-track" aria-hidden="true">
                  <span className="compare-axis" />
                  {values.map((value, index) => (
                    <span key={index} className="compare-tick" style={{ left: at(value) }} />
                  ))}
                  <span
                    className="gap-link"
                    style={{
                      left: at(Math.min(driveValue, walkValue)),
                      width: `calc(${at(Math.max(driveValue, walkValue))} - ${at(Math.min(driveValue, walkValue))})`,
                    }}
                  />
                  <span className="gap-mark gap-drive" style={{ left: at(driveValue) }} />
                  <span className="gap-mark gap-walk" style={{ left: at(walkValue) }} />
                </span>
                <span className="sr-only">
                  {locale === 'id'
                    ? `${d('drive', locale)}: posisi ke-${rulerRank(drivePoints, driveValue)} dari ${set.length}; ${d('walk', locale)}: posisi ke-${rulerRank(walkPoints, walkValue)} dari ${set.length}, bila set diurutkan menurut metrik ini dari yang terkecil.`
                    : `${d('drive', locale)}: position ${rulerRank(drivePoints, driveValue)} of ${set.length}; ${d('walk', locale)}: position ${rulerRank(walkPoints, walkValue)} of ${set.length}, when the set is sorted by this metric, smallest first.`}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
