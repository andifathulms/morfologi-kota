import Link from 'next/link'
import type { ManifestEntry } from '@/data/sites'
import { NetworkDrawing } from '@/components/network/NetworkDrawing'
import { Rose } from '@/components/rose/Rose'
import { PairMetricTable } from '@/components/metrics/PairMetricTable'
import { CoverageMeter } from '@/components/metrics/CoverageBadge'
import { RoseTable } from '@/components/table/RoseTable'
import { DistributionRuler, type DistributionPoint } from '@/components/metrics/DistributionRuler'
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
 *
 * Ranked, not just present (DESIGN.md §6).
 *
 * Everything on this card was here before and all of it still is. What changed
 * is the order of arrival and the weight each element carries, because as set
 * the card gave a reader no way to tell the evidence from the apparatus: ten
 * mono rows made a block roughly twice the visual mass of the drawing they
 * describe, H appeared twice at the same size as median segment length, and
 * the coverage flag — the qualifier on the whole comparison — arrived after
 * all of it, by which point a reader has already drawn their conclusion from
 * the gap.
 *
 * So: the caveat before the figure, the figure before the numbers, one number
 * set as the headline, and the rest in the recessive column they always were.
 * The card is bounded by a rule at the top rather than a box on four sides —
 * a box makes sixteen documents, and a top rule makes one plate of sixteen
 * figures, which is what small multiples are for.
 *
 * The 2026 pass kept that order: the rose sits beside its numbers rather than
 * above them, and the metric column became one table carrying both modes,
 * each metric named once — twice the figures in less height, about 1,140 px
 * against 1,270 at four to a row. The disc is the link to the pair, because it
 * is the thing a reader wants to open.
 */
export function SiteCard({
  entry,
  geometry,
  locale,
  mode = 'drive',
  entropyScale,
}: {
  readonly entry: ManifestEntry
  readonly geometry: readonly (readonly (readonly [number, number])[])[]
  readonly locale: Locale
  readonly mode?: Mode
  /**
   * The set this card's H is read against (DESIGN.md §6a). Optional: a card
   * outside the plate has no set to be positioned in, and draws none.
   */
  readonly entropyScale?: {
    readonly drive: readonly DistributionPoint[]
    readonly walk: readonly DistributionPoint[]
    readonly min: number
    readonly max: number
  }
}) {
  /*
   * One axis for both rulers, so the distance between the two marks is ΔH.
   * Independently scaled rulers would put the two figures on two different
   * axes, and the gap — the whole subject — is the one thing the pair of
   * rulers would then be unable to show.
   */
  const scale =
    entropyScale === undefined
      ? undefined
      : {
          drive: (
            <DistributionRuler
              points={entropyScale.drive}
              min={entropyScale.min}
              max={entropyScale.max}
              value={entry.drive.orientationEntropy}
              ink="var(--drive)"
              label={`H — ${d('drive', locale)}`}
              places={3}
              locale={locale}
            />
          ),
          walk: (
            <DistributionRuler
              points={entropyScale.walk}
              min={entropyScale.min}
              max={entropyScale.max}
              value={entry.walk.orientationEntropy}
              ink="var(--walk)"
              label={`H — ${d('walk', locale)}`}
              places={3}
              locale={locale}
            />
          ),
        }
  const scaleNote =
    entropyScale === undefined
      ? undefined
      : locale === 'id'
        ? `sebaran ${entropyScale.drive.length} lokasi`
        : `spread of ${entropyScale.drive.length} sites`

  return (
    <article className="site-card flex h-full flex-col gap-3 border-t-2 border-ink pt-3">
      <header>
        {/* An h3: the card sits inside the plate, which has its own h2. As an
            h2 the sixteen cards were siblings of the introduction's sections,
            so the outline ran from the last paragraph of prose straight into
            an unannounced list of place names. */}
        <h3 className="m-0 font-serif text-lg font-medium leading-tight tracking-heading">
          <Link href={`/${locale}/lokasi/${entry.slug}`} className="no-underline">
            {entry.name}
          </Link>
        </h3>
        <p className="m-0 font-sans text-xs text-ink-subtle">
          {entry.city} · {t(SITE_TYPE_LABEL[entry.type] ?? { id: entry.type, en: entry.type }, locale)}
        </p>
      </header>

      {/* Ahead of the drawing, not under the metric column. Nine of sixteen
          sites are flagged, and the flag bounds every number beneath it
          (PRD §4). A reader meets the qualifier before the thing qualified. */}
      <CoverageMeter coverage={entry.coverage} locale={locale} metric="coverage" />

      {/* The disc opens the pair. Named with the site, so a links list reads
          as sixteen destinations rather than sixteen copies of one phrase. */}
      <Link
        href={`/${locale}/lokasi/${entry.slug}`}
        className="card-disc relative block no-underline"
        aria-label={`${d('openPair', locale)} — ${entry.name}`}
      >
        <NetworkDrawing
          geometry={geometry}
          radiusM={entry.radiusM}
          size={360}
          responsive
          label={`${entry.name} — ${d(mode === 'drive' ? 'drive' : 'walk', locale)}`}
        />
        <span className="card-open" aria-hidden="true">
          {locale === 'id' ? 'Buka pasangan →' : 'Open the pair →'}
        </span>
      </Link>

      {/* The rose and its numbers, at headline weight — the rose's caption is
          the card's headline, so H is stated once rather than twice
          (DESIGN.md §7, and Invariants §12: a rose without its numbers is a
          shape, not a measurement). */}
      {/* `data-card` is the density control's handle (DESIGN.md §6). The
          drawing, the coverage line and the rose table carry none, because no
          density mode is allowed to drop them. */}
      <div data-card="rose">
      <Rose
        locale={locale}
        size={150}
        method={false}
        headline={{
          scale,
          note: scaleNote,
          /* Which figure the plate is currently ordered by, marked on the
             figure. A reader should never have to look back up at the control
             to remember what they sorted by (DESIGN.md §6). */
          metricKeys: { drive: 'entropyDrive', walk: 'entropyWalk', delta: 'entropyDelta' },
        }}
        series={[
          {
            shares: entry.drive.rose.shares,
            kind: 'drive',
            orientationEntropy: entry.drive.orientationEntropy,
            orientationOrder: entry.drive.orientationOrder,
          },
          {
            shares: entry.walk.rose.shares,
            kind: 'walk',
            orientationEntropy: entry.walk.orientationEntropy,
            orientationOrder: entry.walk.orientationOrder,
          },
        ]}
      />
      </div>

      <div data-card="metrics">
        <PairMetricTable drive={entry.drive} walk={entry.walk} locale={locale} label={entry.name} />
      </div>

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
      <p
        data-card="note"
        className="m-0 max-w-prose font-serif text-base leading-note text-ink-muted"
      >
        {t(entry.note, locale)}
      </p>

      {/* DESIGN.md §9 — the legend contract, on every card. The coverage half
          of it is stated at the top, where it can still change a reading. */}
      <footer
        data-card="footer"
        className="tabular mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-rule pt-2"
      >
        <p className="m-0 font-mono text-xs text-ink-subtle">
          {d('radius', locale)} {entry.radiusM} m · 36 bin
        </p>
        {/* Named with the site. Sixteen cards each carried the same link text,
            which reads fine inside a card and is useless in the links list
            many readers navigate by. WCAG 2.4.9. */}
        <Link
          href={`/${locale}/lokasi/${entry.slug}`}
          className="font-sans text-xs font-semibold underline decoration-1 underline-offset-4"
        >
          {locale === 'id' ? 'Pasangan' : 'The pair'}
          <span className="sr-only"> — {entry.name}</span> →
        </Link>
      </footer>
    </article>
  )
}
