/**
 * Every site lands in a named island group.
 *
 * The Lokasi index groups by where a site is. A centre that falls outside
 * every box is filed under "Lainnya" rather than guessed into a neighbour —
 * and this fails when that happens, so a site in a new region is noticed
 * rather than quietly listed at the bottom of the page.
 */

import { describe, expect, it } from 'vitest'
import { islandGroup } from '@/lib/islands'
import { SITES } from '@/data/sites'

describe('island groups', () => {
  it('place every site in a named group', () => {
    for (const site of SITES) {
      expect(islandGroup(site.centreLatDeg, site.centreLonDeg), site.slug).not.toBe('lainnya')
    }
  })

  it('put known centres where they are', () => {
    expect(islandGroup(-6.2, 106.83)).toBe('jawa') // Menteng
    expect(islandGroup(-0.99, 116.69)).toBe('kalimantan') // IKN
    expect(islandGroup(-5.13, 119.42)).toBe('sulawesi') // Makassar
    expect(islandGroup(-8.68, 115.26)).toBe('bali-nusa-tenggara') // Denpasar
    expect(islandGroup(0.94, 104.44)).toBe('sumatra') // Tanjungpinang
    expect(islandGroup(-2.56, 140.72)).toBe('maluku-papua') // Jayapura
  })
})
