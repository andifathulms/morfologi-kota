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
    slug: 'kampung-braga',
    name: 'Kampung Braga',
    city: 'Bandung',
    type: 'kampung',
    centreLatDeg: -6.9175,
    centreLonDeg: 107.6095,
    note: {
      id: 'Kampung di tepi Cikapundung, tepat di belakang Jalan Braga. Gangnya terpetakan rapat — salah satu dari sedikit lokasi yang selisih kendara/jalan kakinya dapat dibaca.',
      en: 'A kampung on the Cikapundung, directly behind Jalan Braga. Its gang are densely mapped — one of the few sites here whose drive/walk gap can actually be read.',
    },
  },
  {
    slug: 'kotagede',
    name: 'Kotagede',
    city: 'Yogyakarta',
    type: 'kampung',
    centreLatDeg: -7.8265,
    centreLonDeg: 110.3975,
    note: {
      id: 'Inti Mataram abad ke-16 yang kini menjadi permukiman padat; lorong-lorongnya lebih tua daripada jalan yang mengelilinginya.',
      en: 'The sixteenth-century Mataram core, now dense settlement; its lanes are older than the roads around them.',
    },
  },
  {
    slug: 'kayutangan',
    name: 'Kayutangan',
    city: 'Malang',
    type: 'kampung',
    centreLatDeg: -7.9755,
    centreLonDeg: 112.6295,
    note: {
      id: 'Kampung bertingkat di balik koridor Kayutangan, turun ke arah Kali Brantas.',
      en: 'A terraced kampung behind the Kayutangan corridor, dropping toward the Brantas.',
    },
  },
  {
    slug: 'pantai-indah-kapuk',
    name: 'Pantai Indah Kapuk',
    city: 'Jakarta Utara',
    type: 'kota-baru',
    centreLatDeg: -6.1035,
    centreLonDeg: 106.7395,
    note: {
      id: 'Kota baru di atas lahan reklamasi, dengan jaringan pejalan kaki yang justru terpetakan lebih baik daripada kebanyakan kampung di kumpulan ini.',
      en: 'A new town on reclaimed land, whose pedestrian network is better mapped than that of most kampung in this set.',
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
    slug: 'empang',
    name: 'Empang',
    city: 'Bogor',
    type: 'kampung',
    centreLatDeg: -6.608,
    centreLonDeg: 106.796,
    note: {
      id: 'Kampung padat di selatan koridor pecinan Suryakencana, dijalin gang sempit di antara blok-blok kecil.',
      en: 'A dense kampung south of the Suryakencana pecinan corridor, threaded with narrow gang between small blocks.',
    },
  },
  {
    slug: 'pasar-atas',
    name: 'Pasar Atas',
    city: 'Bukittinggi',
    type: 'kota-kecil',
    centreLatDeg: -0.3055,
    centreLonDeg: 100.3691,
    note: {
      id: 'Kota pasar di dataran tinggi Minangkabau, terbelah ngarai: sebagian jaringan pejalan kakinya adalah tangga umum, bukan gang datar.',
      en: 'A Minangkabau highland market town cut by a ravine: part of its walking network is public stairs rather than level gang.',
    },
  },
  {
    slug: 'ubud',
    name: 'Ubud',
    city: 'Gianyar',
    type: 'kota-kecil',
    centreLatDeg: -8.5065,
    centreLonDeg: 115.2625,
    note: {
      id: 'Desa yang memanjang di antara dua sungai. Jaringan jalan kakinya sebagian besar bertanda path — jalan setapak sawah dan punggung bukit — bukan gang di antara rumah, jadi selisih kendara/jalan kaki di sini adalah bentang alam sebanyak permukimannya.',
      en: 'A village strung between two rivers. Most of its walking network is tagged path — rice-field and ridge tracks — rather than gang between houses, so the drive/walk gap here is as much its landscape as its settlement.',
    },
  },
  {
    slug: 'kebayoran-baru',
    name: 'Kebayoran Baru',
    city: 'Jakarta Selatan',
    type: 'kota-baru',
    centreLatDeg: -6.2414,
    centreLonDeg: 106.7998,
    note: {
      id: 'Kota satelit terencana tahun 1950-an: blok besar, jalan berseri, dan koridor angkutan di tengahnya. Kota baru yang tidak berpagar — satu-satunya kawasan terencana dalam kumpulan ini yang cakupan gangnya memadai.',
      en: 'A planned satellite town of the 1950s: large blocks, serially named streets, and a transit corridor through the middle. A new town that is not gated — the only planned area in this set whose gang coverage is adequate.',
    },
  },
  {
    slug: 'cihapit',
    name: 'Cihapit',
    city: 'Bandung',
    type: 'kolonial',
    centreLatDeg: -6.9035,
    centreLonDeg: 107.6211,
    note: {
      id: 'Kawasan terencana Bandung era kolonial, jalan-jalannya bernama pulau — Bali, Bangka, Belitung, Lombok. Trotoarnya terpetakan lebih panjang daripada jalan perumahannya.',
      en: 'A colonial-era planned quarter of Bandung whose streets are named after islands — Bali, Bangka, Belitung, Lombok. More footway is mapped here than residential street.',
    },
  },
  {
    slug: 'pathuk',
    name: 'Pathuk',
    city: 'Yogyakarta',
    type: 'kampung',
    centreLatDeg: -7.7945,
    centreLonDeg: 110.3505,
    note: {
      id: 'Kampung di barat Malioboro dengan jalan bernama tokoh wayang. Sebagian besar jaringannya bertanda living street, bukan jalan perumahan biasa.',
      en: 'A kampung west of Malioboro with streets named after wayang figures. Most of its network is tagged living street rather than ordinary residential road.',
    },
  },
  {
    slug: 'kesepuhan',
    name: 'Kesepuhan',
    city: 'Cirebon',
    type: 'kampung',
    centreLatDeg: -6.7292,
    centreLonDeg: 108.5806,
    note: {
      id: 'Kampung di sekitar Keraton Kasepuhan, dijalin gang bernama pohon dan jalan yang cukup untuk satu kendaraan.',
      en: 'The kampung around the Kasepuhan kraton, threaded with gang named after trees and streets wide enough for one vehicle.',
    },
  },
  {
    slug: 'sanur-kaja',
    name: 'Sanur Kaja',
    city: 'Denpasar',
    type: 'kampung',
    centreLatDeg: -8.678,
    centreLonDeg: 115.2627,
    note: {
      id: 'Sisi utara Sanur, di belakang Jalan Danau Tamblingan. Jaringannya didominasi living street: lorong-lorong pekarangan yang dipakai bersama kendaraan dan pejalan kaki.',
      en: 'The northern side of Sanur, behind Jalan Danau Tamblingan. Its network is dominated by living street — compound lanes shared between vehicles and people on foot.',
    },
  },
  {
    slug: 'gadang',
    name: 'Gadang',
    city: 'Banjarmasin',
    type: 'kampung',
    centreLatDeg: -3.3173,
    centreLonDeg: 114.5912,
    note: {
      id: 'Kampung di kota kanal. Jaringan pejalan kakinya sepanjang jalan perumahannya — titian dan gang yang mengikuti air, bukan pelengkap jalan kendaraan.',
      en: 'A kampung in a canal city. Its pedestrian network is as long as its residential streets — walkways and gang that follow the water rather than accompany a road.',
    },
  },
  {
    slug: 'gapuk-utara',
    name: 'Gapuk Utara',
    city: 'Mataram',
    type: 'kampung',
    centreLatDeg: -8.5768,
    centreLonDeg: 116.0946,
    note: {
      id: 'Permukiman padat di tengah Mataram, dengan jaringan jalan perumahan yang jauh lebih panjang daripada lokasi mana pun dalam kumpulan ini.',
      en: 'Dense settlement in central Mataram, carrying far more residential street than anywhere else in this set.',
    },
  },
  {
    slug: 'hamadi',
    name: 'Hamadi',
    city: 'Jayapura',
    type: 'kampung',
    centreLatDeg: -2.5621,
    centreLonDeg: 140.7175,
    note: {
      id: 'Permukiman di selatan Jayapura, terjepit antara teluk dan punggungan. Jalan perumahannya panjang dan jaringan pejalan kakinya tipis — pola yang di sini berarti dua hal sekaligus: bentuknya, dan seberapa banyak yang sudah terpetakan.',
      en: 'Settlement south of Jayapura, pinched between the bay and the ridge. Long residential streets and a thin pedestrian network — a pattern that here means two things at once: its form, and how much of it has been mapped.',
    },
  },
  {
    slug: 'cipayung-depok',
    name: 'Cipayung',
    city: 'Depok',
    type: 'perumahan',
    centreLatDeg: -6.4067,
    centreLonDeg: 106.8056,
    note: {
      id: 'Kluster berpagar dan kampung yang ditumbuhinya, di cakram yang sama: 76 gerbang terpetakan di dalam radius ini, di samping gang bernama burung dan jalan kavling bernama Inggris. Satu-satunya lokasi perumahan dalam kumpulan ini yang gangnya cukup terpetakan untuk dibandingkan.',
      en: 'Gated clusters and the kampung they grew among, in one disc: 76 mapped gates inside this radius, beside gang named after birds and plot roads named in English. The only perumahan site in this set whose gang are mapped densely enough to compare.',
    },
  },
  {
    slug: 'kampung-bugis-tanjungpinang',
    name: 'Kampung Bugis',
    city: 'Tanjungpinang',
    type: 'kampung',
    centreLatDeg: 0.9427,
    centreLonDeg: 104.4435,
    note: {
      id: 'Permukiman di atas air di seberang pelabuhan. Jalannya bernama pelantar — dermaga kayu yang berfungsi sebagai jalan, bukan trotoar di sisi jalan.',
      en: 'A settlement built over the water across from the harbour. Its streets are named pelantar — timber jetties that serve as streets rather than pavements beside one.',
    },
  },
  {
    slug: 'palangka',
    name: 'Palangka',
    city: 'Palangka Raya',
    type: 'kota-baru',
    centreLatDeg: -2.2085,
    centreLonDeg: 113.9159,
    note: {
      id: 'Inti kota yang dirancang dari nol pada 1957 dan sempat dicalonkan sebagai ibu kota. Sumbu-sumbunya lebar dan bernama pahlawan; kota terencana kedua dalam kumpulan ini yang dapat diletakkan di samping IKN.',
      en: 'A city core laid out from nothing in 1957 and once proposed as the capital. Broad axes named after national figures; the second planned capital-scale city in this set, and the one that can be placed beside IKN.',
    },
  },
  {
    slug: 'lasoani',
    name: 'Lasoani',
    city: 'Palu',
    type: 'kampung',
    centreLatDeg: -0.896,
    centreLonDeg: 119.9107,
    note: {
      id: 'Permukiman di timur Palu, di kaki perbukitan. Pemetaannya rapat karena kota ini dipetakan ulang secara terorganisir setelah gempa dan likuefaksi 2018.',
      en: 'Settlement in eastern Palu, at the foot of the hills. It is densely mapped because the city was remapped in an organised effort after the 2018 earthquake and liquefaction.',
    },
  },
  {
    slug: 'penurunan',
    name: 'Penurunan',
    city: 'Bengkulu',
    type: 'kampung',
    centreLatDeg: -3.8063,
    centreLonDeg: 102.2609,
    note: {
      id: 'Kampung di pusat Bengkulu, tak jauh dari pantai, dengan jalinan living street yang panjangnya separuh jalan perumahannya.',
      en: 'A kampung in central Bengkulu, not far from the shore, threaded with living street half as long again as its residential road.',
    },
  },
  {
    slug: 'singkawang-tengah',
    name: 'Singkawang Tengah',
    city: 'Singkawang',
    type: 'kampung',
    centreLatDeg: 0.908,
    centreLonDeg: 108.9877,
    note: {
      id: 'Pusat kota Singkawang, dijalin gang bernama — Bunga, Sukses, Sederhana, Khatulistiwa — di antara jalan perumahan yang jauh lebih panjang.',
      en: 'The centre of Singkawang, threaded with named gang — Bunga, Sukses, Sederhana, Khatulistiwa — between residential streets several times their length.',
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

/**
 * The two sites drawn under every tag mapping on the assumptions page.
 *
 * Named here rather than derived, because the choice is editorial and should
 * be reviewable in a diff: one kampung, where the mapping decides whether the
 * gang are streets, and one planned cluster, where it decides whether the
 * internal service roads are. Those are the two places the choice bites, and
 * showing them is cheaper than showing sixteen — the geometry is most of the
 * derived database, so this is a payload decision as much as an editorial one.
 *
 * Chosen for the mapping question, never for their metrics.
 */
export const MAPPING_EXEMPLAR_SLUGS: readonly string[] = ['kayutangan', 'bsd-cluster']

export function siteBySlug(slug: string): Site | undefined {
  return SITES.find((site) => site.slug === slug)
}

export * from './schema'
