import type { ModeMetrics } from '@/lib/morphology'
import { d, type Locale } from '@/lib/i18n'
import { signed, signedPercent } from '@/lib/format'

/**
 * The delta column — walk minus drive (PRD §6.2).
 *
 * The gap is the finding, so it is rendered as a comparison rather than
 * described in a caption. The signs are kept because the sign is the point,
 * and the column is ink rather than either hue: it belongs to neither mode,
 * and a diverging colour scale here would smuggle in the ranking §4 forbids.
 */
export function DeltaColumn({
  drive,
  walk,
  locale,
}: {
  readonly drive: ModeMetrics
  readonly walk: ModeMetrics
  readonly locale: Locale
}) {
  const rows: readonly { label: string; value: string }[] = [
    {
      label: d('entropy', locale),
      value: signed(walk.orientationEntropy - drive.orientationEntropy, 3),
    },
    { label: 'H / H max', value: signed(walk.normalisedEntropy - drive.normalisedEntropy, 3) },
    { label: d('phi', locale), value: signed(walk.orientationOrder - drive.orientationOrder, 3) },
    { label: d('circuity', locale), value: signed(walk.sampledCircuity - drive.sampledCircuity, 3) },
    {
      label: d('averageDegree', locale),
      value: signed(walk.degrees.averageDegree - drive.degrees.averageDegree, 2),
    },
    {
      label: d('fourWay', locale),
      value: signedPercent(walk.degrees.proportions.fourWay - drive.degrees.proportions.fourWay),
    },
    {
      label: d('deadEnd', locale),
      value: signedPercent(walk.degrees.proportions.deadEnd - drive.degrees.proportions.deadEnd),
    },
    {
      label: d('intersectionDensity', locale),
      value: signed(walk.intersectionDensityPerKm2 - drive.intersectionDensityPerKm2, 0),
    },
    {
      label: d('medianSegment', locale),
      value: signed(walk.medianSegmentLengthM - drive.medianSegmentLengthM, 0),
    },
    {
      label: d('totalLength', locale),
      value: signed((walk.totalLengthM - drive.totalLengthM) / 1000, 1),
    },
  ]

  return (
    <div className="font-mono text-xs">
      <p className="mb-1 font-sans text-base font-semibold">
        {d('delta', locale)}
        <span className="ml-1 font-normal text-ink-subtle">
          {d('walk', locale)} − {d('drive', locale)}
        </span>
      </p>
      <dl className="tabular m-0 grid grid-cols-[1fr_auto] gap-x-4">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            {/* Labels stay visible. They were hidden on desktop on the
                assumption that these rows would line up with the metric
                columns either side, but each pane carries a drawing and a rose
                above its column, so nothing lines up and a bare number would
                be unreadable. */}
            <dt className="border-b border-rule-faint py-px text-ink-subtle">{row.label}</dt>
            <dd className="m-0 border-b border-rule-faint py-px text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
