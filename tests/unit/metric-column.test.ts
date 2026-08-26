/**
 * The card prints H once.
 *
 * The plate sets H and φ at headline size inside the rose's caption
 * (DESIGN.md §7), so the metric column beneath it must not print them again:
 * two identical figures at two different weights read as two measurements,
 * and a reader has no way to tell that they are one.
 *
 * Everywhere else — the pair, the assumptions page — the column is unchanged
 * and carries every row, which is the half of this that is easy to break by
 * making the omission the default.
 */

import { describe, expect, it } from 'vitest'
import { metricRows } from '@/components/metrics/MetricColumn'
import { loadManifest } from '@/lib/data'
import { d } from '@/lib/i18n'

const entry = loadManifest().sites[0]

describe('the metric column', () => {
  it('has a site to read', () => {
    expect(entry).toBeDefined()
  })

  it('carries every row by default', () => {
    if (entry === undefined) return
    const labels = metricRows(entry.drive, 'id').map((row) => row.label)
    expect(labels).toContain(d('entropy', 'id'))
    expect(labels).toContain(d('phi', 'id'))
    expect(labels).toContain('H / H max')
  })

  it('drops only the two figures the headline already prints', () => {
    if (entry === undefined) return
    const all = metricRows(entry.drive, 'id')
    const headlined = metricRows(entry.drive, 'id', true)
    const dropped = all
      .filter((row) => !headlined.some((kept) => kept.label === row.label))
      .map((row) => row.label)
    expect(dropped).toEqual([d('entropy', 'id'), d('phi', 'id')])
  })

  it('keeps the normalised entropy, which is a different figure', () => {
    if (entry === undefined) return
    expect(metricRows(entry.drive, 'id', true).map((row) => row.label)).toContain('H / H max')
  })

  it('keeps its order, so the eye can travel between cards', () => {
    if (entry === undefined) return
    const first = metricRows(entry.drive, 'id', true).map((row) => row.label)
    const second = metricRows(entry.walk, 'id', true).map((row) => row.label)
    expect(first).toEqual(second)
  })
})
