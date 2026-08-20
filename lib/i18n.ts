/**
 * Indonesian first, English secondary (PRD front matter).
 *
 * Morphology terms keep their standard English form where that is what a
 * reader will meet elsewhere — entropy, circuity, dead-end — rather than being
 * translated into something they would then have to translate back.
 */

export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export interface Bilingual {
  readonly id: string
  readonly en: string
}

export function t(text: Bilingual, locale: Locale): string {
  return locale === 'en' ? text.en : text.id
}

const dictionary = {
  siteTitle: { id: 'Bentuk Kota', en: 'Bentuk Kota' },
  /*
   * The standing one-line description, in the masthead of every page. It says
   * what the thing is; the plate's h1 says why it matters, and the two are
   * deliberately worded apart so they do not read as a stutter when they sit
   * four lines from each other on the landing view.
   */
  tagline: {
    id: 'Morfologi jaringan jalan Indonesia — jaringan kendara dan jaringan jalan kaki, diukur terpisah untuk tempat yang sama.',
    en: 'Indonesian street network morphology — the driving network and the walking network, measured separately for the same place.',
  },
  navPlate: { id: 'Lempeng', en: 'The plate' },
  navAssumptions: { id: 'Asumsi', en: 'Assumptions' },
  navMethod: { id: 'Metode', en: 'Method' },
  drive: { id: 'Kendara', en: 'Drive' },
  walk: { id: 'Jalan kaki', en: 'Walk' },
  delta: { id: 'Selisih', en: 'Delta' },
  radius: { id: 'Jari-jari', en: 'Radius' },
  coverage: { id: 'Cakupan gang', en: 'Footway coverage' },
  coverageThin: { id: 'tipis', en: 'thin' },
  coverageModerate: { id: 'sedang', en: 'moderate' },
  coverageGood: { id: 'cukup', en: 'good' },
  thinWarning: {
    id: 'Cakupan gang tipis. Jaringan pejalan kaki di sini kemungkinan belum terpetakan lengkap, jadi selisihnya tidak dapat dibaca sebagai temuan.',
    en: 'Thin footway coverage. The walking network here is probably not fully mapped, so the gap cannot be read as a finding.',
  },
  entropy: { id: 'Entropi orientasi', en: 'Orientation entropy' },
  entropyShort: { id: 'H', en: 'H' },
  phi: { id: 'φ keteraturan', en: 'φ orientation-order' },
  circuity: { id: 'Circuity', en: 'Circuity' },
  averageDegree: { id: 'Derajat simpul rata-rata', en: 'Average node degree' },
  fourWay: { id: 'Simpang empat', en: 'Four-way' },
  deadEnd: { id: 'Jalan buntu', en: 'Dead-end' },
  intersectionDensity: { id: 'Kerapatan simpang', en: 'Intersection density' },
  medianSegment: { id: 'Panjang ruas median', en: 'Median segment length' },
  totalLength: { id: 'Panjang jaringan', en: 'Network length' },
  sortBy: { id: 'Urutkan menurut', en: 'Sort by' },
  sortName: { id: 'Nama', en: 'Name' },
  openPair: { id: 'Buka pasangan kendara / jalan kaki', en: 'Open the drive / walk pair' },
  roseTable: { id: 'Tabel rose — 36 bin', en: 'Rose as a table — 36 bins' },
  bearingRange: { id: 'Rentang arah', en: 'Bearing range' },
  share: { id: 'Bagian', en: 'Share' },
  bin: { id: 'Bin', en: 'Bin' },
  describesNotScores: {
    id: 'Alat ini menjelaskan bentuk kota. Ia tidak menilainya.',
    en: 'This describes urban form. It does not rate it.',
  },
  tagMapping: { id: 'Pemetaan tag', en: 'Tag mapping' },
  backToPlate: { id: '← Kembali ke lempeng', en: '← Back to the plate' },
  downloadSite: {
    id: 'Unduh data lokasi ini (JSON, ODbL)',
    en: 'Download this site’s data (JSON, ODbL)',
  },
  downloadManifest: {
    id: 'Unduh manifest — parameter dan metrik seluruh lokasi (JSON, ODbL)',
    en: 'Download the manifest — parameters and metrics for every site (JSON, ODbL)',
  },
  offered: {
    id: 'Basis data turunan ini ditawarkan di bawah ODbL, sebagaimana share-alike mensyaratkan.',
    en: 'This derived database is offered under ODbL, as share-alike requires.',
  },
  print: { id: 'Cetak halaman ini', en: 'Print this page' },

  /*
   * The key. The two hues sit at 1.4:1 to each other, so hue alone was never
   * carrying this — it is named in words, and the rose repeats the same
   * solid-versus-outlined distinction the swatches show (DESIGN.md §10).
   */
  keyHeading: { id: 'Dua jaringan, satu tempat', en: 'Two networks, one place' },
  keyDrive: {
    id: 'Jalan yang dapat dilalui kendaraan bermotor.',
    en: 'The streets a motor vehicle can use.',
  },
  keyWalk: {
    id: 'Semua yang di atas, ditambah gang, jalur pejalan kaki dan tangga.',
    en: 'All of the above, plus gang, footpaths and steps.',
  },
  sortNotRanking: {
    id: 'Mengurutkan ulang memunculkan pola pada keseluruhan set. Ini bukan peringkat: tidak ada posisi yang lebih baik daripada posisi lain.',
    en: 'Re-sorting makes a pattern across the set visible. It is not a ranking: no position in the order is better than another.',
  },
  exampleHeading: { id: 'Contoh', en: 'For example' },
  caveatHeading: {
    id: 'Sebelum membaca angkanya',
    en: 'Before reading the numbers',
  },

  /* The difference drawing — what walking adds, drawn as itself. */
  differenceHeading: {
    id: 'Yang ditambahkan berjalan kaki',
    en: 'What walking adds',
  },
  differenceCaption: {
    id: 'Tinta: ruas yang hanya ada di jaringan pejalan kaki. Garis tipis: jaringan yang dipakai bersama kedua moda. Keanggotaan ditentukan oleh pemetaan tag — sebuah ruas dihitung “hanya jalan kaki” bila jalan asalnya di OSM tidak diterima jaringan kendaraan.',
    en: 'Ink: the edges that exist only in the walking network. Hairline: the network both modes share. Membership is decided by the tag mapping — an edge counts as walk-only when the OSM way it came from is not admitted to the driving network.',
  },
  walkOnlyLength: { id: 'Panjang hanya jalan kaki', en: 'Walk-only length' },
  pairPanes: {
    id: 'Kendara dan jalan kaki berdampingan — geser mendatar pada layar sempit',
    en: 'Drive and walk side by side — scrolls horizontally on a narrow screen',
  },
  roseTableRegion: {
    id: 'Tabel rose, dapat digeser mendatar',
    en: 'Rose table, scrolls horizontally',
  },
  tableRegion: {
    id: 'Tabel, dapat digeser mendatar',
    en: 'Table, scrolls horizontally',
  },
  roseTableCaption: {
    id: 'Bagian panjang jaringan per bin arah selebar 10°, untuk kendara dan jalan kaki.',
    en: 'Share of network length per 10° bearing bin, for drive and walk.',
  },
  walkOnlyShare: { id: 'Bagian dari jaringan jalan kaki', en: 'Share of walking network' },

  /* Provenance. */
  extractVersion: { id: 'Versi ekstrak', en: 'Extract version' },
  extractVersionNote: {
    id: 'Lokasi diambil satu per satu dan berjarak, jadi OpenStreetMap bergerak di antaranya. Angka di halaman ini berasal dari ekstrak ini.',
    en: 'Sites are fetched one at a time and spaced, so OpenStreetMap moves between them. The numbers on this page come from this extract.',
  },

  /* The mapping exemplars. */
  mappingDrawingHeading: {
    id: 'Pemetaan yang sama, digambar',
    en: 'The same mapping, drawn',
  },
  mappingDrawingNote: {
    id: 'Cakram yang sama, pemetaan tag berbeda. Angka di tabel-tabel di atas bergerak karena garis-garis inilah yang masuk dan keluar. Hanya dua lokasi contoh yang membawa gambar ini: geometri adalah sebagian besar isi basis data turunan, dan membawanya untuk enam belas lokasi akan melipatgandakannya demi gambar yang muncul dua kali.',
    en: 'The same disc, different tag mappings. The numbers in the tables above move because these are the lines coming and going. Only two exemplar sites carry these drawings: geometry is most of the derived database, and carrying it for all sixteen would multiply it for a figure shown twice.',
  },

  /* Site selection — the survey. */
  selectionHeading: { id: 'Bagaimana lokasi ini dipilih', en: 'How these sites were chosen' },
  surveyAdopted: { id: 'diadopsi', en: 'adopted' },
  surveyNotAdopted: { id: '—', en: '—' },
  surveyCandidate: { id: 'Kandidat', en: 'Candidate' },
  surveyStatus: { id: 'Status', en: 'Status' },
  downloadSurvey: {
    id: 'Unduh survei kandidat (JSON, ODbL)',
    en: 'Download the candidate survey (JSON, ODbL)',
  },
} as const

export type DictionaryKey = keyof typeof dictionary

export function d(key: DictionaryKey, locale: Locale): string {
  return t(dictionary[key], locale)
}

export const SITE_TYPE_LABEL: Record<string, Bilingual> = {
  kampung: { id: 'Kampung kota', en: 'Kampung kota' },
  perumahan: { id: 'Perumahan kluster', en: 'Perumahan cluster' },
  kolonial: { id: 'Petak kolonial', en: 'Colonial grid' },
  'kota-baru': { id: 'Kota baru', en: 'New town' },
  ikn: { id: 'IKN', en: 'IKN' },
}
