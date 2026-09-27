import type { Bilingual } from '@/lib/i18n'

/**
 * Which island group a site's centre lies in — the Lokasi index's grouping.
 *
 * A fact about location, never a classification of form. DESIGN.md §3 forbids
 * colouring or grouping by site type because that would pre-classify what the
 * tool measures; where a site is on the archipelago says nothing about its
 * streets, which is why this grouping is allowed and why it tints nothing.
 *
 * Coarse boxes in degrees, ordered west to east, and each one chosen to hold
 * the main island and nothing else in the set. A centre outside every box is
 * `lainnya` rather than guessed into a neighbour; `tests/unit/islands.test.ts`
 * fails if a site ever lands there, so a new site in a new region is noticed.
 */

export type IslandGroup =
  | 'sumatra'
  | 'jawa'
  | 'bali-nusa-tenggara'
  | 'kalimantan'
  | 'sulawesi'
  | 'maluku-papua'
  | 'lainnya'

export const ISLAND_ORDER: readonly IslandGroup[] = [
  'sumatra',
  'jawa',
  'bali-nusa-tenggara',
  'kalimantan',
  'sulawesi',
  'maluku-papua',
  'lainnya',
]

export const ISLAND_LABEL: Readonly<Record<IslandGroup, Bilingual>> = {
  sumatra: { id: 'Sumatra & Kepulauan Riau', en: 'Sumatra & Riau Islands' },
  jawa: { id: 'Jawa', en: 'Java' },
  'bali-nusa-tenggara': { id: 'Bali & Nusa Tenggara', en: 'Bali & Nusa Tenggara' },
  kalimantan: { id: 'Kalimantan', en: 'Kalimantan' },
  sulawesi: { id: 'Sulawesi', en: 'Sulawesi' },
  'maluku-papua': { id: 'Maluku & Papua', en: 'Maluku & Papua' },
  lainnya: { id: 'Lainnya', en: 'Elsewhere' },
}

export function islandGroup(latDeg: number, lonDeg: number): IslandGroup {
  if (lonDeg >= 125) return 'maluku-papua'
  // Sulawesi before Kalimantan: the Makassar Strait is the line at ~119° E.
  if (lonDeg >= 118.8 && latDeg > -7 && latDeg < 2.5) return 'sulawesi'
  if (lonDeg >= 114.3 && latDeg <= -8) return 'bali-nusa-tenggara'
  if (lonDeg >= 105 && lonDeg < 114.7 && latDeg <= -5.8 && latDeg > -9) return 'jawa'
  if (lonDeg >= 108.5 && lonDeg < 119 && latDeg > -4.5 && latDeg < 4.5) return 'kalimantan'
  if (lonDeg >= 95 && lonDeg < 108.5 && latDeg > -6 && latDeg < 6) return 'sumatra'
  return 'lainnya'
}
