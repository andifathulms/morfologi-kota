import Link from 'next/link'
import type { ManifestEntry, SiteBundle } from '@/data/sites'
import { LayeredNetworkDrawing } from '@/components/network/NetworkDrawing'
import { ModeSwatch } from '@/components/legend/ModeKey'
import { d, type Locale } from '@/lib/i18n'
import { fixed, kilometres, signed } from '@/lib/format'

/**
 * The plate's opening: one site, one disc, three readings of it.
 *
 * The page used to open with a paragraph about entropy and two static discs
 * side by side, which asks a reader to subtract one drawing from the other by
 * eye. This shows the claim instead of describing it. The same disc is drawn
 * as the driving network, the walking network, or the difference — the edges
 * only reachable on foot in ink over the network both modes share, which is
 * the one distinction a network drawing may make (DESIGN.md §5). The readout
 * and the H scale follow the choice.
 *
 * It is DESIGN.md §8's orchestrated moment, moved to where every reader meets
 * it: choosing *Selisih* draws the walk-only edges in over the shared network.
 *
 * No script. Three radio inputs and `:has()` rules in `globals.css`, the same
 * architecture as the sort; the difference is the default, so a browser
 * without `:has()` shows the figure the page is about and loses only the
 * switch.
 *
 * Chosen by the page, not here: the largest walk-over-drive gain among the
 * readable kampung, selected on coverage and network length and never on
 * entropy, which would be choosing the finding in advance (PRD §4).
 */

const VIEWS = ['drive', 'walk', 'diff'] as const
type View = (typeof VIEWS)[number]

/** ln 4 and ln 36: a perfect four-bin grid and a uniform spread (PRD §8). */
const H_GRID = Math.log(4)
const H_UNIFORM = Math.log(36)

function viewLabel(view: View, locale: Locale): string {
  switch (view) {
    case 'drive':
      return d('drive', locale)
    case 'walk':
      return d('walk', locale)
    case 'diff':
      return d('delta', locale)
    default: {
      const never: never = view
      throw new Error(`unknown view: ${String(never)}`)
    }
  }
}

export function PlateHero({
  entry,
  bundle,
  locale,
  count,
}: {
  readonly entry: ManifestEntry
  readonly bundle: SiteBundle
  readonly locale: Locale
  readonly count: number
}) {
  const walkOnly = new Set(bundle.walkOnly.plateIndices)
  const walkGeometry = bundle.walk.plateGeometry
  const shared = walkGeometry.filter((_, index) => !walkOnly.has(index))
  const added = walkGeometry.filter((_, index) => walkOnly.has(index))

  const drive = entry.drive
  const walk = entry.walk
  const at = (h: number) => ((h - H_GRID) / (H_UNIFORM - H_GRID)) * 100

  const readout: readonly {
    key: string
    label: string
    drive: string
    walk: string
    delta: string
  }[] = [
    {
      key: 'length',
      label: d('totalLength', locale),
      drive: kilometres(drive.totalLengthM),
      walk: kilometres(walk.totalLengthM),
      delta:
        locale === 'id'
          ? `+${kilometres(bundle.walkOnly.lengthM)} hanya bagi pejalan kaki`
          : `+${kilometres(bundle.walkOnly.lengthM)} reachable only on foot`,
    },
    {
      key: 'density',
      label: d('intersectionDensity', locale),
      drive: `${fixed(drive.intersectionDensityPerKm2, 0)} /km²`,
      walk: `${fixed(walk.intersectionDensityPerKm2, 0)} /km²`,
      delta: `${signed(walk.intersectionDensityPerKm2 - drive.intersectionDensityPerKm2, 0)} /km²`,
    },
    {
      key: 'entropy',
      label: d('entropy', locale),
      drive: fixed(drive.orientationEntropy, 3),
      walk: fixed(walk.orientationEntropy, 3),
      delta: `ΔH ${signed(walk.orientationEntropy - drive.orientationEntropy, 3)}`,
    },
  ]

  const caption: Record<View, string> =
    locale === 'id'
      ? {
          drive: `${d('drive', locale)}: jalan yang dapat dilalui kendaraan bermotor — ${kilometres(drive.totalLengthM)}.`,
          walk: `${d('walk', locale)}: semua jalan di atas, ditambah gang, jalur pejalan kaki dan tangga — ${kilometres(walk.totalLengthM)}.`,
          diff: `${d('delta', locale)}: ruas yang hanya dapat dijalani kaki, dengan tinta, di atas jaringan yang dimiliki keduanya, dengan garis abu.`,
        }
      : {
          drive: `${d('drive', locale)}: the streets a motor vehicle can use — ${kilometres(drive.totalLengthM)}.`,
          walk: `${d('walk', locale)}: all of the above, plus gang, footways and stairs — ${kilometres(walk.totalLengthM)}.`,
          diff: `${d('delta', locale)}: the edges reachable only on foot, in ink, over the network both modes share, in grey.`,
        }

  return (
    <section className="plate-hero pb-12 pt-4 lg:pb-16 lg:pt-8" aria-labelledby="judul">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
        <div>
          <p className="tabular m-0 font-mono text-xs text-ink-subtle">
            {locale === 'id' ? 'Morfologi jaringan jalan' : 'Street network morphology'} · {count}{' '}
            {locale === 'id' ? 'lokasi' : 'sites'} · r = {entry.radiusM} m
          </p>
          <h1
            id="judul"
            className="m-0 mt-4 font-serif text-3xl font-medium leading-none tracking-display md:text-4xl"
          >
            {locale === 'id'
              ? 'Lingkungan yang sama, dua kota berbeda.'
              : 'The same neighbourhood, two different cities.'}
          </h1>
          <p className="mt-6 max-w-prose font-serif text-md leading-prose text-ink-muted">
            {locale === 'id'
              ? `Di ${entry.name}, ${entry.city}, lingkaran berjari-jari ${entry.radiusM} m yang sama berisi ${kilometres(drive.totalLengthM)} jalan bila Anda mengemudi dan ${kilometres(walk.totalLengthM)} bila Anda berjalan kaki. Selisih itulah yang diukur di sini, untuk setiap lokasi, dengan cara yang sama — entropi orientasi menurut Boeing (2019), dihitung terpisah untuk kedua jaringan.`
              : `In ${entry.name}, ${entry.city}, the same ${entry.radiusM} m disc holds ${kilometres(drive.totalLengthM)} of street if you drive and ${kilometres(walk.totalLengthM)} if you walk. That difference is what is measured here, for every site, the same way — orientation entropy after Boeing (2019), computed separately for the two networks.`}
          </p>

          <fieldset className="m-0 mt-8 border-0 p-0">
            <legend className="sr-only">
              {locale === 'id' ? 'Tampilkan jaringan' : 'Show network'}
            </legend>
            <div className="seg">
              {VIEWS.map((view) => (
                <span key={view} className="contents">
                  <input
                    type="radio"
                    name="hero-view"
                    id={`hero-${view}`}
                    defaultChecked={view === 'diff'}
                    className="sr-only"
                  />
                  <label htmlFor={`hero-${view}`}>
                    {view === 'diff' ? null : <ModeSwatch mode={view} />}
                    {viewLabel(view, locale)}
                  </label>
                </span>
              ))}
            </div>
          </fieldset>

          <dl className="tabular m-0 mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
            {readout.map((row) => (
              <div key={row.key}>
                <dt className="font-sans text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                  {row.label}
                </dt>
                <dd className="m-0 mt-1 font-mono text-xl leading-none tracking-heading">
                  <span data-view="drive">{row.drive}</span>
                  <span data-view="walk diff">{row.walk}</span>
                </dd>
                <dd data-view="diff" className="m-0 mt-2 font-sans text-xs leading-note text-ink-muted">
                  {row.delta}
                </dd>
              </div>
            ))}
          </dl>

          {/*
            The scale H is read on, with its two ends named by what produces
            them — the calibration networks the method page draws. Neither end
            is preferable; they are the two limits of the measure (PRD §4).
          */}
          <figure className="m-0 mt-8 max-w-md">
            <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="block h-6 w-full" aria-hidden="true">
              <line className="ruler-axis" x1={0} y1={8} x2={100} y2={8} />
              <line className="ruler-axis" x1={0.2} y1={4} x2={0.2} y2={12} />
              <line className="ruler-axis" x1={99.8} y1={4} x2={99.8} y2={12} />
              <line
                data-view="drive diff"
                className="ruler-mark"
                x1={at(drive.orientationEntropy).toFixed(2)}
                x2={at(drive.orientationEntropy).toFixed(2)}
                y1={1}
                y2={12}
                stroke="var(--drive)"
              />
              <line
                data-view="walk diff"
                className="ruler-mark"
                x1={at(walk.orientationEntropy).toFixed(2)}
                x2={at(walk.orientationEntropy).toFixed(2)}
                y1={1}
                y2={12}
                stroke="var(--walk)"
              />
            </svg>
            <figcaption className="tabular mt-1 flex justify-between gap-4 font-sans text-xs text-ink-subtle">
              <span>
                <span className="font-mono">{fixed(H_GRID, 3)}</span>{' '}
                {locale === 'id' ? 'petak sempurna' : 'perfect grid'}
              </span>
              <span className="text-right">
                <span className="font-mono">{fixed(H_UNIFORM, 3)}</span>{' '}
                {locale === 'id' ? 'arah merata' : 'uniform bearings'}
              </span>
            </figcaption>
          </figure>
        </div>

        <figure className="m-0 justify-self-center lg:w-full">
          <LayeredNetworkDrawing
            instanceId="judul"
            radiusM={bundle.radiusM}
            size={560}
            label={
              locale === 'id'
                ? `${entry.name}, ${entry.city} — jaringan kendara, jaringan jalan kaki, dan selisihnya`
                : `${entry.name}, ${entry.city} — driving network, walking network, and the difference`
            }
            layers={[
              { id: 'drive', geometry: bundle.drive.plateGeometry, animate: true },
              { id: 'shared', geometry: shared },
              { id: 'walk-only', geometry: added, animate: true },
            ]}
          />
          <figcaption className="mx-auto mt-3 max-w-prose text-center font-sans text-base leading-note text-ink-subtle">
            {VIEWS.map((view) => (
              <span key={view} data-view={view}>
                {caption[view]}
              </span>
            ))}{' '}
            <Link href={`/${locale}/lokasi/${entry.slug}`} className="whitespace-nowrap text-ink">
              {d('openPair', locale)} — {entry.name}
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
