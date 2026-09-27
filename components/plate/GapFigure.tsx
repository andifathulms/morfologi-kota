import Link from 'next/link'
import type { ManifestEntry } from '@/data/sites'
import { ModeSwatch } from '@/components/legend/ModeKey'
import { SITE_TYPE_LABEL, d, t, type Locale } from '@/lib/i18n'
import { fixed, percent, signed, signedPercent } from '@/lib/format'

/**
 * The gap, at every site, in one figure.
 *
 * Two marks per row — the driving network and the walking network — on one
 * axis, so the length of the line between them *is* the gap. It replaced a
 * 24-row table that said the same thing in numbers a reader had to subtract.
 *
 * The guards are the distribution ruler's (DESIGN.md §6a), for the same
 * reason: this is the other figure in the product that could be misread as a
 * league table.
 *
 * - **Sorted, and it says so.** Rows are ordered by the gap, largest first,
 *   and the heading says *diurutkan menurut*. Being higher is not being
 *   better (PRD §4).
 * - **No ramp, no hue beyond the two inks.** Drive is a solid square and walk
 *   an outlined one, the same shape cue the rose uses (DESIGN.md §3, §10).
 * - **Thin sites are shown and not compared.** They sit in their own block
 *   below the readable ones, under a heading that says so, with hollow marks
 *   and a broken line. Dropping them would hide the data's biggest finding;
 *   interleaving them would compare them (CLAUDE.md, Invariants §5).
 *
 * Three metrics, switched with radio inputs and `:has()` like everything else
 * on the plate. Each is a list of real text, so the figure reads in order to
 * a screen reader, and the full table sits beneath it as the text equivalent.
 */

type GapMetric = 'length' | 'density' | 'deadEnd'
const METRICS: readonly GapMetric[] = ['length', 'density', 'deadEnd']

interface MetricSpec {
  readonly label: string
  readonly value: (entry: ManifestEntry, mode: 'drive' | 'walk') => number
  readonly step: number
  readonly unit: string
  readonly format: (value: number) => string
  readonly formatDelta: (delta: number) => string
}

function spec(metric: GapMetric, locale: Locale): MetricSpec {
  switch (metric) {
    case 'length':
      return {
        label: d('totalLength', locale),
        value: (entry, mode) => entry[mode].totalLengthM / 1000,
        step: 10,
        unit: 'km',
        format: (v) => `${fixed(v, 1)} km`,
        formatDelta: (v) => `${signed(v, 1)} km`,
      }
    case 'density':
      return {
        label: d('intersectionDensity', locale),
        value: (entry, mode) => entry[mode].intersectionDensityPerKm2,
        step: 100,
        unit: '/km²',
        format: (v) => `${fixed(v, 0)} /km²`,
        formatDelta: (v) => `${signed(v, 0)} /km²`,
      }
    case 'deadEnd':
      return {
        label: d('deadEnd', locale),
        value: (entry, mode) => entry[mode].degrees.proportions.deadEnd * 100,
        step: 10,
        unit: '%',
        format: (v) => percent(v / 100),
        formatDelta: (v) => signedPercent(v / 100),
      }
    default: {
      const never: never = metric
      throw new Error(`unknown gap metric: ${String(never)}`)
    }
  }
}

function Rows({
  entries,
  metric,
  max,
  thin,
  locale,
}: {
  readonly entries: readonly ManifestEntry[]
  readonly metric: MetricSpec
  readonly max: number
  readonly thin: boolean
  readonly locale: Locale
}) {
  const at = (value: number) => `${((Math.max(0, value) / max) * 100).toFixed(2)}%`
  return (
    <ol className="m-0 list-none p-0" style={{ ['--gap-step' as string]: `${(metric.step / max) * 100}%` }}>
      {entries.map((entry) => {
        const driveValue = metric.value(entry, 'drive')
        const walkValue = metric.value(entry, 'walk')
        const low = Math.min(driveValue, walkValue)
        const high = Math.max(driveValue, walkValue)
        return (
          <li key={entry.slug} className="gap-row" data-thin={thin ? '' : undefined}>
            <span className="gap-name">
              <Link href={`/${locale}/lokasi/${entry.slug}`} className="no-underline">
                {entry.name}
              </Link>{' '}
              <span className="gap-city">{entry.city}</span>
            </span>
            <span className="gap-track" aria-hidden="true">
              <span className="gap-link" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />
              <span className="gap-mark gap-drive" style={{ left: at(driveValue) }} />
              <span className="gap-mark gap-walk" style={{ left: at(walkValue) }} />
            </span>
            <span className="gap-delta tabular">
              {metric.formatDelta(walkValue - driveValue)}
              <span className="sr-only">
                {' '}
                — {d('drive', locale)} {metric.format(driveValue)}, {d('walk', locale)}{' '}
                {metric.format(walkValue)}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function GapFigure({
  entries,
  locale,
  closing,
}: {
  readonly entries: readonly ManifestEntry[]
  readonly locale: Locale
  /** The sentence that bounds what the figure can be read to say. */
  readonly closing: string
}) {
  const readable = entries.filter((entry) => entry.coverage.confidence.type !== 'thin')
  const thin = entries.filter((entry) => entry.coverage.confidence.type === 'thin')

  return (
    <section className="gap-figure mb-16" aria-labelledby="selisih">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-prose">
          <h2 id="selisih" className="m-0 font-serif text-xl font-medium tracking-heading">
            {locale === 'id' ? 'Selisih di setiap lokasi' : 'The gap at every site'}
          </h2>
          <p className="m-0 mt-2 font-sans text-base leading-note text-ink-muted">
            {locale === 'id'
              ? 'Satu baris per lokasi; jarak antara dua tanda adalah selisihnya. Diurutkan menurut selisih, terbesar dulu — urutan, bukan peringkat.'
              : 'One row per site; the distance between the two marks is the gap. Sorted by the gap, largest first — an order, not a ranking.'}
          </p>
        </div>
        <fieldset className="m-0 border-0 p-0">
          <legend className="sr-only">{locale === 'id' ? 'Metrik selisih' : 'Gap metric'}</legend>
          <div className="seg seg-sm">
            {METRICS.map((metric) => (
              <span key={metric} className="contents">
                <input
                  type="radio"
                  name="gap-metric"
                  id={`gap-${metric}`}
                  defaultChecked={metric === 'length'}
                  className="sr-only"
                />
                <label htmlFor={`gap-${metric}`}>{spec(metric, locale).label}</label>
              </span>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="m-0 mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-ink-subtle">
        <span className="inline-flex items-center gap-2">
          <ModeSwatch mode="drive" /> {d('drive', locale)}
        </span>
        <span className="inline-flex items-center gap-2">
          <ModeSwatch mode="walk" /> {d('walk', locale)}
        </span>
      </p>

      {METRICS.map((metric) => {
        const m = spec(metric, locale)
        const values = entries.flatMap((entry) => [m.value(entry, 'drive'), m.value(entry, 'walk')])
        const max = Math.ceil((Math.max(...values) * 1.02) / m.step) * m.step
        const byGap = (list: readonly ManifestEntry[]) =>
          [...list].sort((a, b) => {
            const gapA = m.value(a, 'walk') - m.value(a, 'drive')
            const gapB = m.value(b, 'walk') - m.value(b, 'drive')
            return gapB - gapA || a.name.localeCompare(b.name, locale)
          })
        const ticks = Array.from({ length: Math.round(max / m.step) + 1 }, (_, i) => i * m.step)

        return (
          <div key={metric} data-gap={metric} className="mt-4">
            <div className="gap-row gap-axis" aria-hidden="true">
              <span />
              <span className="gap-track">
                {ticks.map((tick) => (
                  <span key={tick} className="gap-tick tabular" style={{ left: `${(tick / max) * 100}%` }}>
                    {fixed(tick, 0)}
                  </span>
                ))}
              </span>
              <span className="gap-delta">{m.unit}</span>
            </div>
            <Rows entries={byGap(readable)} metric={m} max={max} thin={false} locale={locale} />
            {thin.length > 0 ? (
              <>
                <p className="gap-thin-head">
                  <span aria-hidden="true">⚑ </span>
                  {locale === 'id'
                    ? `Cakupan gang tipis — ${thin.length} lokasi, ditampilkan, tidak dibandingkan`
                    : `Thin footway coverage — ${thin.length} sites, shown and not compared`}
                </p>
                <Rows entries={byGap(thin)} metric={m} max={max} thin locale={locale} />
              </>
            ) : null}
          </div>
        )
      })}

      <p className="m-0 mt-6 max-w-prose font-serif text-md leading-prose text-ink-muted">{closing}</p>

      {/* DESIGN.md §10 — the figure's text equivalent, present and collapsed.
          It is the table the plate used to print in full. */}
      <details className="mt-4 font-sans text-base">
        <summary className="cursor-pointer text-ink-muted">
          {locale === 'id'
            ? `Tabel yang sama sebagai teks — ${entries.length} lokasi`
            : `The same as a table — ${entries.length} sites`}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="tabular w-full max-w-table border-collapse text-xs">
            <caption className="sr-only">
              {locale === 'id'
                ? 'Selisih jalan kaki dikurangi kendara per lokasi, diurutkan menurut tambahan panjang jaringan; lokasi bercakupan tipis di bagian bawah.'
                : 'Walk minus drive per site, sorted by network length gained; thin-coverage sites last.'}
            </caption>
            <thead>
              <tr className="border-b border-rule-strong text-left">
                <th scope="col" className="py-1 pr-4 font-semibold">
                  {locale === 'id' ? 'Lokasi' : 'Site'}
                </th>
                <th scope="col" className="py-1 pr-4 font-semibold">
                  {locale === 'id' ? 'Jenis' : 'Type'}
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  {d('coverage', locale)}
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  Δ {d('totalLength', locale)}
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  Δ {d('deadEnd', locale)}
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  ΔH
                </th>
              </tr>
            </thead>
            <tbody>
              {[...readable, ...thin]
                .map((entry) => ({ entry, gain: entry.walk.totalLengthM - entry.drive.totalLengthM }))
                .sort((a, b) => {
                  const thinA = a.entry.coverage.confidence.type === 'thin' ? 1 : 0
                  const thinB = b.entry.coverage.confidence.type === 'thin' ? 1 : 0
                  return thinA - thinB || b.gain - a.gain
                })
                .map(({ entry, gain }) => (
                  <tr key={entry.slug} className="border-b border-rule-faint">
                    <th scope="row" className="py-1 pr-4 text-left font-normal">
                      <Link href={`/${locale}/lokasi/${entry.slug}`}>{entry.name}</Link>
                    </th>
                    <td className="py-1 pr-4 text-ink-subtle">
                      {t(SITE_TYPE_LABEL[entry.type] ?? { id: entry.type, en: entry.type }, locale)}
                    </td>
                    <td className="py-1 pr-4 text-right font-mono">
                      {entry.coverage.confidence.type === 'thin' ? '⚑ ' : ''}
                      {percent(entry.coverage.pedestrianShare)}
                    </td>
                    <td className="py-1 pr-4 text-right font-mono">{signed(gain / 1000, 1)} km</td>
                    <td className="py-1 pr-4 text-right font-mono">
                      {signedPercent(
                        entry.walk.degrees.proportions.deadEnd - entry.drive.degrees.proportions.deadEnd,
                      )}
                    </td>
                    <td className="py-1 pr-4 text-right font-mono">
                      {signed(entry.walk.orientationEntropy - entry.drive.orientationEntropy, 3)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
