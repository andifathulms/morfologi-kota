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
  tagline: {
    id: 'Lingkungan yang sama adalah dua kota berbeda, tergantung Anda mengemudi atau berjalan kaki.',
    en: 'The same neighbourhood is two different cities depending on whether you drive or walk.',
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
