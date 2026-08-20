/**
 * Site definitions and the shape of everything the pipeline emits.
 *
 * Zod rather than a bare interface because these files are the contract
 * between a build-time script and a static export: if a site is malformed or a
 * bundle is missing a mode, the build must fail rather than the page render a
 * half-comparison (CLAUDE.md, Invariants §4).
 */

import { z } from 'zod'

/**
 * The sampling radius, fixed across the whole comparison set and printed on
 * every card (PRD §4). Changing it changes every metric, so it is one constant
 * here rather than a per-site field.
 */
export const SAMPLING_RADIUS_M = 800

/**
 * Site type is a label, never a colour and never a category the metrics are
 * allowed to assume (DESIGN.md §3 — no colour coding by site type).
 */
export const siteTypeSchema = z.enum(['kampung', 'perumahan', 'kolonial', 'kota-baru', 'ikn'])
export type SiteType = z.infer<typeof siteTypeSchema>

export const siteSchema = z.object({
  /** Stable and readable — it appears in the URL. */
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'slug is lowercase, digits and hyphens only'),
  name: z.string().min(2),
  city: z.string().min(2),
  type: siteTypeSchema,
  centreLatDeg: z.number().min(-11).max(6),
  centreLonDeg: z.number().min(95).max(141),
  /** One sentence, descriptive. Never an assessment. */
  note: z.object({ id: z.string().min(4), en: z.string().min(4) }),
})
export type Site = z.infer<typeof siteSchema>

export const sitesSchema = z.array(siteSchema).min(1)

/** A polyline in local metres about the site centre, ready to draw. */
export const polylineSchema = z.array(z.tuple([z.number(), z.number()])).min(2)

export const roseSchema = z.object({
  binCentresDeg: z.array(z.number()).length(36),
  shares: z.array(z.number().min(0).max(1)).length(36),
  totalWeight: z.number().min(0),
})

export const degreeStatsSchema = z.object({
  nodeCount: z.number().int().min(0),
  edgeCount: z.number().int().min(0),
  averageDegree: z.number().min(0),
  proportions: z.object({
    deadEnd: z.number().min(0).max(1),
    through: z.number().min(0).max(1),
    threeWay: z.number().min(0).max(1),
    fourWay: z.number().min(0).max(1),
    fivePlus: z.number().min(0).max(1),
  }),
  intersectionCount: z.number().int().min(0),
})

export const modeMetricsSchema = z.object({
  rose: roseSchema,
  orientationEntropy: z.number().min(0),
  normalisedEntropy: z.number().min(0).max(1),
  orientationOrder: z.number().min(0).max(1),
  edgeCircuity: z.number().min(1),
  sampledCircuity: z.number().min(1),
  sampledPairCount: z.number().int().min(0),
  unreachablePairCount: z.number().int().min(0),
  degrees: degreeStatsSchema,
  intersectionDensityPerKm2: z.number().min(0),
  medianSegmentLengthM: z.number().min(0),
  totalLengthM: z.number().min(0),
})

export const coverageSchema = z.object({
  pedestrianShare: z.number().min(0).max(1),
  pedestrianLengthM: z.number().min(0),
  walkLengthM: z.number().min(0),
  pedestrianDensityMPerKm2: z.number().min(0),
  confidence: z.object({
    type: z.enum(['thin', 'moderate', 'good']),
    pedestrianShare: z.number().min(0).max(1),
  }),
})

/**
 * The metrics whose dependence on the tag mapping is tracked. Everything a
 * card prints, so nothing on the page is left unaccounted for.
 */
export const sensitivityValuesSchema = z.object({
  orientationEntropy: z.number(),
  orientationOrder: z.number(),
  sampledCircuity: z.number(),
  averageDegree: z.number(),
  fourWayProportion: z.number(),
  deadEndProportion: z.number(),
  intersectionDensityPerKm2: z.number(),
  medianSegmentLengthM: z.number(),
  totalLengthM: z.number(),
})
export type SensitivityValues = z.infer<typeof sensitivityValuesSchema>

/** One tag mapping's effect on one site's numbers — reported, not asserted. */
export const sensitivityEntrySchema = z.object({
  mappingId: z.string(),
  drive: sensitivityValuesSchema,
  walk: sensitivityValuesSchema,
})

/**
 * How far a metric moves when the tag mapping changes, across the whole set.
 *
 * This is a statement about the *method*, not about any site: it says which
 * numbers a reader may take at face value and which ones only mean anything
 * alongside the mapping that produced them. Nothing here rates a place.
 */
export const stabilitySchema = z.enum(['robust', 'moderate', 'sensitive'])
export type Stability = z.infer<typeof stabilitySchema>

export const sensitivitySummaryEntrySchema = z.object({
  /** Key into SensitivityValues. */
  metric: z.string(),
  mode: z.enum(['drive', 'walk']),
  /** Which alternative mapping this compares against the default. */
  mappingId: z.string(),
  meanAbsoluteChange: z.number().min(0),
  maxAbsoluteChange: z.number().min(0),
  /** Mean of |change| ÷ |default value|, over sites where the default is non-zero. */
  meanRelativeChange: z.number().min(0),
  /** The site that moves most under this mapping. */
  worstSlug: z.string(),
  stability: stabilitySchema,
})
export type SensitivitySummaryEntry = z.infer<typeof sensitivitySummaryEntrySchema>

/**
 * A site bundle. Both modes are required: a site with one mode is incomplete,
 * not a partial result (CLAUDE.md, Invariants §4).
 */
export const siteBundleSchema = z.object({
  site: siteSchema,
  radiusM: z.number().positive(),
  mappingId: z.string(),
  drive: z.object({
    metrics: modeMetricsSchema,
    /** Full detail — the pair view draws a site large. */
    geometry: z.array(polylineSchema),
    /** Coarser, for the plate, where a site is 200 px across. */
    plateGeometry: z.array(polylineSchema),
  }),
  walk: z.object({
    metrics: modeMetricsSchema,
    geometry: z.array(polylineSchema),
    plateGeometry: z.array(polylineSchema),
  }),
  coverage: coverageSchema,
  sensitivity: z.array(sensitivityEntrySchema).min(1),
  attribution: z.string().min(10),
  licence: z.literal('ODbL-1.0'),
})
export type SiteBundle = z.infer<typeof siteBundleSchema>

export const manifestEntrySchema = z.object({
  slug: z.string(),
  name: z.string(),
  city: z.string(),
  type: siteTypeSchema,
  centreLatDeg: z.number(),
  centreLonDeg: z.number(),
  note: z.object({ id: z.string(), en: z.string() }),
  radiusM: z.number().positive(),
  coverage: coverageSchema,
  drive: modeMetricsSchema.omit({ rose: true }).extend({ rose: roseSchema }),
  walk: modeMetricsSchema.omit({ rose: true }).extend({ rose: roseSchema }),
})
export type ManifestEntry = z.infer<typeof manifestEntrySchema>

/**
 * Thresholds on the mean relative change, chosen so that "robust" means a
 * reader can compare the number across sites without knowing the mapping, and
 * "sensitive" means the number is only meaningful stated together with it.
 */
export const ROBUST_THRESHOLD = 0.05
export const SENSITIVE_THRESHOLD = 0.15

export function classifyStability(meanRelativeChange: number): Stability {
  if (meanRelativeChange < ROBUST_THRESHOLD) return 'robust'
  if (meanRelativeChange < SENSITIVE_THRESHOLD) return 'moderate'
  return 'sensitive'
}

export const manifestSchema = z.object({
  /** Fixed across the comparison set, printed on every card. */
  radiusM: z.number().positive(),
  mappingId: z.string(),
  /** Which OSM extract the numbers came from — determinism depends on it. */
  extractVersion: z.string().min(1),
  binCount: z.literal(36),
  method: z.object({ citation: z.string().min(20), doi: z.string().min(5) }),
  attribution: z.string().min(10),
  licence: z.literal('ODbL-1.0'),
  sites: z.array(manifestEntrySchema).min(1),
  /** Which metrics survive a change of tag mapping, and which do not. */
  sensitivitySummary: z.array(sensitivitySummaryEntrySchema),
})
export type Manifest = z.infer<typeof manifestSchema>

export const ODBL_ATTRIBUTION =
  'Data jalan © OpenStreetMap contributors, ODbL 1.0. Basis data turunan ini ditawarkan dengan lisensi yang sama.'

export const BOEING_CITATION =
  'Boeing, G. 2019. Urban Spatial Order: Street Network Orientation, Configuration, and Entropy. Applied Network Science 4(1):67.'

export const BOEING_DOI = '10.1007/s41109-019-0189-1'
