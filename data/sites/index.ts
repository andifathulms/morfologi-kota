/**
 * The comparison set (PRD §3).
 *
 * Fixed radius across every site so the comparison is fair, and a spread of
 * morphologies rather than a spread of cities: kampung kota, perumahan
 * cluster, colonial grid, new town, and IKN — the open question.
 *
 * Centres are the middle of the fabric being sampled, not a civic address. The
 * notes describe form. None of them evaluates it.
 */

import { sitesSchema, type Site } from './schema'

const sites: Site[] = [
  {
    slug: 'menteng',
    name: 'Menteng',
    city: 'Jakarta Pusat',
    type: 'kolonial',
    centreLatDeg: -6.1955,
    centreLonDeg: 106.832,
    note: {
      id: 'Rancangan Nieuwenhuijs dan Moojen, 1910-an: sumbu lebar, taman bundaran, blok besar.',
      en: 'The Nieuwenhuijs and Moojen plan of the 1910s: broad axes, roundabout gardens, large blocks.',
    },
  },
  {
    slug: 'kota-tua-jakarta',
    name: 'Kota Tua',
    city: 'Jakarta Barat',
    type: 'kolonial',
    centreLatDeg: -6.1352,
    centreLonDeg: 106.8133,
    note: {
      id: 'Kanal dan petak Batavia abad ke-17 yang masih terbaca di bawah jalan sekarang.',
      en: 'The seventeenth-century Batavia canal-and-block plan, still legible under the present streets.',
    },
  },
  {
    slug: 'kota-lama-semarang',
    name: 'Kota Lama',
    city: 'Semarang',
    type: 'kolonial',
    centreLatDeg: -6.968,
    centreLonDeg: 110.4281,
    note: {
      id: 'Petak kolonial kecil dan padat di tepi Kali Semarang.',
      en: 'A small, dense colonial grid on the edge of the Semarang river.',
    },
  },
  {
    slug: 'kampung-bendungan-hilir',
    name: 'Kampung Bendungan Hilir',
    city: 'Jakarta Pusat',
    type: 'kampung',
    centreLatDeg: -6.214,
    centreLonDeg: 106.8125,
    note: {
      id: 'Kampung yang terjepit di antara menara Sudirman, dijalin gang sempit.',
      en: 'A kampung wedged between the Sudirman towers, threaded with narrow gang.',
    },
  },
  {
    slug: 'kampung-melayu',
    name: 'Kampung Melayu',
    city: 'Jakarta Timur',
    type: 'kampung',
    centreLatDeg: -6.2245,
    centreLonDeg: 106.866,
    note: {
      id: 'Permukiman padat di tikungan Ciliwung, tumbuh mengikuti sungai.',
      en: 'Dense settlement on a bend of the Ciliwung, grown along the river.',
    },
  },
  {
    slug: 'kampung-code',
    name: 'Kampung Code',
    city: 'Yogyakarta',
    type: 'kampung',
    centreLatDeg: -7.787,
    centreLonDeg: 110.372,
    note: {
      id: 'Kampung bertingkat di lereng Kali Code, banyak ruasnya berupa tangga.',
      en: 'A terraced kampung on the bank of the Code, where much of the network is steps.',
    },
  },
  {
    slug: 'kampung-lette',
    name: 'Kampung Lette',
    city: 'Makassar',
    type: 'kampung',
    centreLatDeg: -5.134,
    centreLonDeg: 119.416,
    note: {
      id: 'Kampung pesisir di utara Makassar, lorong-lorong sempit di antara blok rumah.',
      en: 'A coastal kampung in northern Makassar, narrow lorong between blocks of houses.',
    },
  },
  {
    slug: 'bsd-cluster',
    name: 'BSD City — kluster',
    city: 'Tangerang Selatan',
    type: 'perumahan',
    centreLatDeg: -6.301,
    centreLonDeg: 106.654,
    note: {
      id: 'Kluster berpagar dengan satu atau dua titik akses ke jalan kolektor.',
      en: 'Gated clusters with one or two access points onto the collector road.',
    },
  },
  {
    slug: 'alam-sutera',
    name: 'Alam Sutera',
    city: 'Tangerang',
    type: 'kota-baru',
    centreLatDeg: -6.232,
    centreLonDeg: 106.654,
    note: {
      id: 'Kota baru dengan jalan melengkung dan hierarki jalan yang tegas.',
      en: 'A new town of curvilinear streets and a firm road hierarchy.',
    },
  },
  {
    slug: 'gading-serpong',
    name: 'Gading Serpong',
    city: 'Tangerang',
    type: 'kota-baru',
    centreLatDeg: -6.24,
    centreLonDeg: 106.626,
    note: {
      id: 'Kota baru dengan sumbu bulevar dan kantong-kantong perumahan di belakangnya.',
      en: 'A new town of boulevard axes with housing pockets behind them.',
    },
  },
  {
    slug: 'panakkukang',
    name: 'Panakkukang',
    city: 'Makassar',
    type: 'perumahan',
    centreLatDeg: -5.156,
    centreLonDeg: 119.446,
    note: {
      id: 'Perumahan terencana tahun 1980-an dengan petak teratur dan banyak jalan buntu.',
      en: 'Planned 1980s housing: regular blocks and a great many cul-de-sacs.',
    },
  },
  {
    slug: 'ikn-inti',
    name: 'IKN — Kawasan Inti',
    city: 'Penajam Paser Utara',
    type: 'ikn',
    centreLatDeg: -0.9853,
    centreLonDeg: 116.69,
    note: {
      id: 'Sumbu Kebangsaan dan sekitarnya. Jaringannya sedang dibangun dan sebagian belum terpetakan — kedua hal itu terlihat di angkanya.',
      en: 'The Sumbu Kebangsaan axis and its surroundings. The network is under construction and partly unmapped — both show in the numbers.',
    },
  },
]

export const SITES: readonly Site[] = sitesSchema.parse(sites)

export function siteBySlug(slug: string): Site | undefined {
  return SITES.find((site) => site.slug === slug)
}

export * from './schema'
