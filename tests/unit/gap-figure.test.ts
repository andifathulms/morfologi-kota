/**
 * The gap figure shows thin sites and does not compare them.
 *
 * It is the second figure in the product that could be read as a league
 * table (DESIGN.md §6c), and its guards are the ruler's: sorted and saying so,
 * and thin-coverage sites set apart. Interleaving a thin site among the
 * readable ones would compare its walking network as though it were complete,
 * which CLAUDE.md's fifth invariant forbids; dropping it would hide the
 * data's first finding. Both halves are asserted here, per metric.
 */

import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GapFigure } from '@/components/plate/GapFigure'
import { loadManifest } from '@/lib/data'

const manifest = loadManifest()
const html = renderToStaticMarkup(
  createElement(GapFigure, { entries: manifest.sites, locale: 'id', closing: '' }),
)
const thin = manifest.sites.filter((site) => site.coverage.confidence.type === 'thin')
const readable = manifest.sites.filter((site) => site.coverage.confidence.type !== 'thin')

/** One metric's block of the figure. */
function block(metric: string): string {
  const start = html.indexOf(`data-gap="${metric}"`)
  expect(start, `the ${metric} block is missing`).toBeGreaterThan(-1)
  const next = html.indexOf('data-gap="', start + 1)
  return html.slice(start, next === -1 ? html.indexOf('<details') : next)
}

describe('the gap figure', () => {
  it('draws every site in every metric, thin ones included', () => {
    for (const metric of ['length', 'density', 'deadEnd']) {
      const section = block(metric)
      for (const site of manifest.sites) {
        expect(section, `${site.slug} is missing from ${metric}`).toContain(`/lokasi/${site.slug}"`)
      }
    }
  })

  it('sets every thin site after the heading that says it is not compared', () => {
    if (thin.length === 0) return
    for (const metric of ['length', 'density', 'deadEnd']) {
      const section = block(metric)
      const heading = section.indexOf('gap-thin-head')
      expect(heading).toBeGreaterThan(-1)
      for (const site of thin) {
        expect(section.indexOf(`/lokasi/${site.slug}"`), `${site.slug} in ${metric}`).toBeGreaterThan(heading)
      }
      for (const site of readable) {
        expect(section.indexOf(`/lokasi/${site.slug}"`), `${site.slug} in ${metric}`).toBeLessThan(heading)
      }
    }
  })

  it('says it is sorted, and never that it ranks', () => {
    expect(html).toContain('Diurutkan menurut')
    expect(html.toLowerCase()).not.toMatch(/\bperingkat ke|\branked\b|\bscore\b|\bskor\b/)
  })
})
