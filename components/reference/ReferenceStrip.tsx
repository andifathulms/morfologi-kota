import type { Reference } from '@/data/sites'
import { NetworkDrawing } from '@/components/network/NetworkDrawing'
import { Rose } from '@/components/rose/Rose'
import { d, t, type Locale } from '@/lib/i18n'
import { fixed } from '@/lib/format'

/**
 * The calibration strip.
 *
 * Nothing in the product told a reader whether H = 3.265 was a high number or
 * a low one. The anchors — ln 4 for a single grid, ln 36 for total disorder —
 * existed only as prose on the method page, and the fixtures that realise them
 * existed only in the test suite.
 *
 * So here they are as figures: the shape, its rose, its number, and the answer
 * that number was supposed to be. The rotated grid is the one worth pausing
 * on — the same shape turned 29°, identical entropy, different bins — because
 * it shows in one glance that the measure describes how ordered a network is
 * and not which way it faces. That is Boeing's Manhattan.
 *
 * Everything is computed by the pipeline and asserted by `data:validate`, so
 * the calibration a reader sees is the calibration CI checks.
 */
export function ReferenceStrip({
  reference,
  locale,
}: {
  readonly reference: Reference
  readonly locale: Locale
}) {
  // The tree is a degree fixture rather than an entropy anchor, so the strip
  // shows the three that bound the entropy scale.
  const shown = reference.networks.filter((network) => network.id !== 'pure-tree')

  return (
    <section className="mt-12" aria-labelledby="skala">
      <h2 id="skala" className="m-0 max-w-prose font-serif text-lg font-semibold">
        {d('referenceHeading', locale)}
      </h2>
      <p className="mt-2 max-w-prose font-serif text-md leading-relaxed">
        {d('referenceNote', locale)}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((network) => (
          <figure key={network.id} className="m-0">
            <h3 className="m-0 font-serif text-md font-semibold">{t(network.label, locale)}</h3>
            <div className="mt-2 flex flex-wrap items-start gap-4">
              <NetworkDrawing
                geometry={network.geometry}
                radiusM={network.radiusM}
                size={150}
                animate={false}
                label={t(network.label, locale)}
                instanceId={`ref-${network.id}`}
              />
              <Rose
                locale={locale}
                size={150}
                animate={false}
                method={false}
                series={[
                  {
                    shares: network.rose.shares,
                    /* Neither network. A perfect grid is not a driving one,
                       and the two hues belong to the drive/walk gap alone
                       (DESIGN.md §3) — so these draw in ink and are named by
                       the heading above rather than by a mode they are not. */
                    kind: 'reference',
                    orientationEntropy: network.orientationEntropy,
                    orientationOrder: network.orientationOrder,
                  },
                ]}
              />
            </div>
            <p className="tabular m-0 mt-1 font-mono text-xs text-ink-subtle">
              {d('referenceExpected', locale)}: {t(network.expected, locale)}
            </p>
            <figcaption className="mt-2 max-w-prose font-sans text-base leading-snug text-ink-muted">
              {t(network.note, locale)}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="tabular mt-4 max-w-prose font-mono text-xs">
        ln 4 = {fixed(reference.gridEntropy, 3)} · ln 36 = {fixed(reference.maxEntropy, 3)} ·{' '}
        {reference.binCount} bin
      </p>
    </section>
  )
}
