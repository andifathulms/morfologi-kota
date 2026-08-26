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
  /*
   * Ubud gets a note for the same reason IKN does: its figures will read as an
   * outlier and a reader deserves to know what the measurement can and cannot
   * see before they explain it to themselves.
   *
   * No superlative, deliberately. "The most ordered site in the set" is a
   * claim about a set that grows, written into static prose that would not
   * grow with it — the plate computes that kind of sentence from the manifest
   * or does not make it.
   */
  ubud: [
    {
      id: 'Angka Ubud menonjol di kedua arah: entropinya rendah dan φ-nya tinggi, artinya jalan-jalannya berjalan pada sedikit arah yang berulang, lebih rapi daripada beberapa kawasan terencana dalam kumpulan ini. Itu yang terukur, dan itu saja.',
      en: 'Ubud’s figures stand out in both directions: low entropy and high φ, meaning its streets run along a small number of repeated bearings — more regularly than several of the planned sites in this set. That is what is measured, and that is all of it.',
    },
    {
      id: 'Yang membatasi pembacaannya adalah isi jaringan pejalan kakinya. Sebagian besarnya bertanda path: jalan setapak sawah dan punggung bukit, bukan gang di antara rumah. Cakupan gang menghitung keduanya sama, sehingga selisih kendara/jalan kaki di sini sebagian adalah bentang alam, bukan hanya permukiman. Perbandingannya dengan kampung kota harus dibaca dengan itu di kepala.',
      en: 'What bounds the reading is what its walking network is made of. Most of it is tagged path — rice-field and ridge tracks rather than gang between houses. Footway coverage counts both the same, so the drive/walk gap here is partly landscape rather than settlement alone. Its comparison with an urban kampung has to be read with that in mind.',
    },
  ],
}

export function editorialFor(slug: string): readonly Bilingual[] {
  return EDITORIAL[slug] ?? []
}
