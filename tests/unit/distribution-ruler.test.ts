/**
 * The ruler positions; it does not rate.
 *
 * PRD §4 forbids a score, a grade, a ranking and an index. The distribution
 * ruler is the closest thing in the product to something that could be
 * misread as one, so the two properties that keep it a sort are asserted
 * here: a position is a count of the values below it — ties share a position,
 * because two sites with the same H are not first and second at anything —
 * and the axis is the observed range of this set, with neither end preferred.
 *
 * The other half of the guard is that both modes share one axis, which is what
 * makes the distance between the two marks ΔH. That is asserted through the
 * plate's own numbers: a walk value below every drive value must still land
 * below them on the shared scale.
 */

import { describe, expect, it } from 'vitest'
import { rulerPosition, rulerRank } from '@/components/metrics/DistributionRuler'
import { loadManifest } from '@/lib/data'

const sites = loadManifest().sites
const drive = sites.map((site) => ({ slug: site.slug, value: site.drive.orientationEntropy }))
const walk = sites.map((site) => ({ slug: site.slug, value: site.walk.orientationEntropy }))
const all = [...drive, ...walk].map((point) => point.value)
const min = Math.min(...all)
const max = Math.max(...all)

describe('the position on the axis', () => {
  it('puts the lowest of the set at the low end and the highest at the high end', () => {
    expect(rulerPosition(min, min, max)).toBe(0)
    expect(rulerPosition(max, min, max)).toBe(100)
  })

  it('is monotone in the value, so the axis reads in one direction', () => {
    const sorted = [...all].sort((a, b) => a - b)
    const positions = sorted.map((value) => rulerPosition(value, min, max))
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1] ?? 0)
    }
  })

  it('never leaves the axis, whatever it is handed', () => {
    for (const value of [min - 10, max + 10, Number.MAX_SAFE_INTEGER]) {
      const x = rulerPosition(value, min, max)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(100)
    }
  })

  it('does not divide by a zero range', () => {
    expect(Number.isFinite(rulerPosition(1, 1, 1))).toBe(true)
  })
})

describe('the position in the set', () => {
  it('runs from one to the size of the set', () => {
    for (const point of drive) {
      const rank = rulerRank(drive, point.value)
      expect(rank).toBeGreaterThanOrEqual(1)
      expect(rank).toBeLessThanOrEqual(drive.length)
    }
  })

  it('gives tied values the same position, because they are not ordered', () => {
    const tied = [
      { slug: 'a', value: 2 },
      { slug: 'b', value: 2 },
      { slug: 'c', value: 1 },
    ]
    expect(rulerRank(tied, 2)).toBe(rulerRank(tied, 2))
    expect(rulerRank(tied, 2)).toBe(2)
    expect(rulerRank(tied, 1)).toBe(1)
  })

  it('places both modes on one shared axis, or the gap could not be read', () => {
    for (const site of sites) {
      const driveX = rulerPosition(site.drive.orientationEntropy, min, max)
      const walkX = rulerPosition(site.walk.orientationEntropy, min, max)
      const gap = site.walk.orientationEntropy - site.drive.orientationEntropy
      // Same axis, so the sign of the offset is the sign of ΔH.
      expect(Math.sign(walkX - driveX)).toBe(Math.sign(Number(gap.toFixed(6))))
    }
  })
})
