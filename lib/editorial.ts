/**
 * Site framing, where a site needs framing.
 *
 * Descriptive, never prescriptive (PRD §6.7). No OIKN or government branding
 * anywhere, including on the IKN card. Nothing here recommends a policy or
 * grades a place; where a claim is made, it is about what the measurement can
 * and cannot see.
 */

import type { Bilingual } from './i18n'

export const EDITORIAL: Readonly<Record<string, readonly Bilingual[]>> = {
  'ikn-inti': [
    {
      id: 'IKN adalah pertanyaan terbuka dalam kumpulan ini. Jaringan jalannya bukan warisan yang diukur setelah jadi, melainkan keputusan yang sedang diambil sekarang: φ berapa yang sedang dipilih, dan rasio jalan buntu berapa.',
      en: 'IKN is the open question in this set. Its street network is not an inheritance being measured after the fact but a decision being made now: what φ is it getting, and what dead-end ratio.',
    },
    {
      id: 'Dua hal membatasi pembacaan angkanya. Sebagian besar kawasan masih dalam pembangunan, sehingga yang terukur adalah jaringan sejauh yang sudah ada. Dan pemetaannya di OpenStreetMap masih tipis — tidak ada satu pun ruas pejalan kaki khusus yang tercatat di dalam radius ini, sehingga jaringan jalan kaki di sini praktis sama dengan jaringan kendaraan. Selisih kendara/jalan kaki untuk lokasi ini tidak dapat dibaca sebagai temuan.',
      en: 'Two things bound what its numbers mean. Much of the area is still under construction, so what is measured is the network as far as it exists. And its OpenStreetMap coverage is thin — not one pedestrian-only segment is recorded inside this radius, so the walking network here is effectively the driving network. The drive/walk gap for this site cannot be read as a finding.',
    },
    {
      id: 'Yang tetap dapat dibaca adalah bentuk yang sudah terbangun: arah-arah sumbu utamanya, dan seberapa jauh ia mengikuti logika satu petak. Itu saja, dan itu memang cukup menarik untuk ditampilkan di samping Menteng dan sebuah kampung.',
      en: 'What can still be read is the form already built: the bearings of its main axes, and how closely it follows the logic of a single grid. That is all, and it is interesting enough to place beside Menteng and a kampung.',
    },
  ],
}

export function editorialFor(slug: string): readonly Bilingual[] {
  return EDITORIAL[slug] ?? []
}
