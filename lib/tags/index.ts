/**
 * Tag interpretation is a modelling choice, not a fact.
 *
 * Which OSM `highway` values count as drivable and which as walkable changes
 * every number in this product (PRD §4). The mapping therefore lives here, in
 * one named and documented place, and is exposed to the interface as a
 * control rather than buried as a constant. Never inline a `highway=` check at
 * a call site.
 */

export type Mode = 'drive' | 'walk'

/** An OSM way reduced to what the morphology needs. */
export interface TaggedWay {
  readonly id: number
  readonly tags: Readonly<Record<string, string>>
  /** Node ids in order along the way. */
  readonly nodes: readonly number[]
}

/**
 * Driving network — Boeing 2019 §"Data and methods" builds the drive network
 * from the road classes a private car may use. These are the OSM `highway`
 * values that carry general motor traffic in Indonesian extracts.
 *
 * `service` is admitted because in Indonesia a great deal of genuinely
 * driveable perumahan access road is tagged `service`; excluding it would
 * hollow out exactly the cluster morphology this project is trying to see.
 * `living_street` is admitted for the same reason.
 */
export const DRIVABLE_HIGHWAY: readonly string[] = [
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'unclassified',
  'residential',
  'living_street',
  'service',
  'road',
] as const

/**
 * Walking network — every drivable class a pedestrian may legally walk along,
 * plus the pedestrian-only classes. The last four are the ones that matter:
 * a kampung's *gang* are tagged `footway`, `path`, `pedestrian` or `steps`,
 * and they are the reason the walking network diverges from the driving one
 * (PRD §2).
 */
export const WALKABLE_HIGHWAY: readonly string[] = [
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'unclassified',
  'residential',
  'living_street',
  'service',
  'road',
  'pedestrian',
  'footway',
  'path',
  'steps',
  'track',
  'corridor',
] as const

/**
 * The pedestrian-only subset. Its share of walking-network length is the
 * footway coverage measure (PRD §4, §6.6): if these are absent from OSM for a
 * kampung, its walking network collapses toward its driving network and the
 * headline gap disappears for the wrong reason.
 */
export const PEDESTRIAN_ONLY_HIGHWAY: readonly string[] = [
  'pedestrian',
  'footway',
  'path',
  'steps',
  'corridor',
] as const

/**
 * Motorways are excluded from the walking network above; these values are the
 * ones a pedestrian is barred from even where the way exists.
 */
export const FOOT_FORBIDDEN_HIGHWAY: readonly string[] = ['motorway', 'motorway_link'] as const

export interface TagMapping {
  /** Stable id — appears in URLs and in the emitted manifest. */
  readonly id: string
  /** Shown in the assumptions control. */
  readonly label: { readonly id: string; readonly en: string }
  readonly note: { readonly id: string; readonly en: string }
  readonly drivable: readonly string[]
  readonly walkable: readonly string[]
}

/** The mapping every shipped number is computed with unless stated otherwise. */
export const DEFAULT_TAG_MAPPING: TagMapping = {
  id: 'default',
  label: { id: 'Baku', en: 'Default' },
  note: {
    id: 'Jalan layanan dihitung sebagai dapat dikendarai; gang (footway, path, steps) hanya masuk jaringan pejalan kaki.',
    en: 'Service roads count as drivable; gang (footway, path, steps) enter the walking network only.',
  },
  drivable: DRIVABLE_HIGHWAY,
  walkable: WALKABLE_HIGHWAY,
}

/**
 * Alternative mappings, shipped so the sensitivity of every metric to this
 * choice can be shown rather than asserted (PRD §8). Each is computed by the
 * pipeline and reported on the assumptions page.
 */
export const STRICT_DRIVE_MAPPING: TagMapping = {
  id: 'strict-drive',
  label: { id: 'Kendara ketat', en: 'Strict drive' },
  note: {
    id: 'Jalan layanan dikeluarkan dari jaringan kendaraan — pembacaan konservatif yang mengecilkan konektivitas perumahan.',
    en: 'Service roads excluded from the driving network — a conservative reading that shrinks perumahan connectivity.',
  },
  drivable: DRIVABLE_HIGHWAY.filter((v) => v !== 'service'),
  walkable: WALKABLE_HIGHWAY,
}

export const NARROW_WALK_MAPPING: TagMapping = {
  id: 'narrow-walk',
  label: { id: 'Jalan kaki sempit', en: 'Narrow walk' },
  note: {
    id: 'Hanya footway dan pedestrian yang dihitung sebagai gang; path dan steps dikeluarkan.',
    en: 'Only footway and pedestrian count as gang; path and steps are excluded.',
  },
  drivable: DRIVABLE_HIGHWAY,
  walkable: WALKABLE_HIGHWAY.filter((v) => v !== 'path' && v !== 'steps' && v !== 'track'),
}

export const TAG_MAPPINGS: readonly TagMapping[] = [
  DEFAULT_TAG_MAPPING,
  STRICT_DRIVE_MAPPING,
  NARROW_WALK_MAPPING,
] as const

export function tagMappingById(id: string): TagMapping | undefined {
  return TAG_MAPPINGS.find((m) => m.id === id)
}

/** The highway values a mapping admits for a mode. */
export function admittedHighways(mapping: TagMapping, mode: Mode): readonly string[] {
  switch (mode) {
    case 'drive':
      return mapping.drivable
    case 'walk':
      return mapping.walkable
    default: {
      const never: never = mode
      throw new Error(`unknown mode: ${String(never)}`)
    }
  }
}

/**
 * Does this way belong to the network for `mode` under `mapping`?
 *
 * Beyond the highway value: `access=no|private` removes a way from both
 * networks, `foot=no` removes it from the walking network, and `motor_vehicle`
 * or `access` restrictions remove it from the driving network. `area=yes` is
 * a polygon, not a segment, and is never part of either.
 */
export function admitsWay(way: TaggedWay, mapping: TagMapping, mode: Mode): boolean {
  const highway = way.tags.highway
  if (highway === undefined) return false
  if (way.tags.area === 'yes') return false

  const access = way.tags.access
  if (access === 'no' || access === 'private') return false

  if (!admittedHighways(mapping, mode).includes(highway)) return false

  switch (mode) {
    case 'drive': {
      const motor = way.tags.motor_vehicle ?? way.tags.motorcar
      if (motor === 'no' || motor === 'private') return false
      return true
    }
    case 'walk': {
      if (FOOT_FORBIDDEN_HIGHWAY.includes(highway)) return false
      if (way.tags.foot === 'no' || way.tags.foot === 'private') return false
      return true
    }
    default: {
      const never: never = mode
      throw new Error(`unknown mode: ${String(never)}`)
    }
  }
}

/** Is this way one of the pedestrian-only classes the coverage measure counts? */
export function isPedestrianOnly(way: TaggedWay): boolean {
  const highway = way.tags.highway
  return highway !== undefined && PEDESTRIAN_ONLY_HIGHWAY.includes(highway)
}
