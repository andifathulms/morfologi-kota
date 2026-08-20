/**
 * The tag mapping decides every number, so its behaviour is pinned here — in
 * particular the asymmetries that are easy to get wrong: a motorway is
 * drivable but not walkable, a footway is walkable but not drivable, and
 * access restrictions remove a way from both.
 */

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TAG_MAPPING,
  NARROW_WALK_MAPPING,
  STRICT_DRIVE_MAPPING,
  admitsWay,
  isPedestrianOnly,
  tagMappingById,
  type TaggedWay,
} from '@/lib/tags'

const way = (tags: Record<string, string>): TaggedWay => ({ id: 1, tags, nodes: [1, 2] })

describe('the default mapping', () => {
  it('admits a residential street to both networks', () => {
    const w = way({ highway: 'residential' })
    expect(admitsWay(w, DEFAULT_TAG_MAPPING, 'drive')).toBe(true)
    expect(admitsWay(w, DEFAULT_TAG_MAPPING, 'walk')).toBe(true)
  })

  it('admits a gang to the walking network only', () => {
    for (const highway of ['footway', 'path', 'steps', 'pedestrian']) {
      const w = way({ highway })
      expect(admitsWay(w, DEFAULT_TAG_MAPPING, 'drive')).toBe(false)
      expect(admitsWay(w, DEFAULT_TAG_MAPPING, 'walk')).toBe(true)
    }
  })

  it('admits a motorway to the driving network only', () => {
    const w = way({ highway: 'motorway' })
    expect(admitsWay(w, DEFAULT_TAG_MAPPING, 'drive')).toBe(true)
    expect(admitsWay(w, DEFAULT_TAG_MAPPING, 'walk')).toBe(false)
  })

  it('admits service roads, because perumahan access roads are tagged that way', () => {
    expect(admitsWay(way({ highway: 'service' }), DEFAULT_TAG_MAPPING, 'drive')).toBe(true)
  })

  it('rejects a way with no highway tag, and a mapped area', () => {
    expect(admitsWay(way({ building: 'yes' }), DEFAULT_TAG_MAPPING, 'walk')).toBe(false)
    expect(admitsWay(way({ highway: 'pedestrian', area: 'yes' }), DEFAULT_TAG_MAPPING, 'walk')).toBe(
      false,
    )
  })

  it('honours access restrictions', () => {
    expect(admitsWay(way({ highway: 'residential', access: 'private' }), DEFAULT_TAG_MAPPING, 'drive')).toBe(false)
    expect(admitsWay(way({ highway: 'residential', access: 'no' }), DEFAULT_TAG_MAPPING, 'walk')).toBe(false)
    expect(admitsWay(way({ highway: 'residential', foot: 'no' }), DEFAULT_TAG_MAPPING, 'walk')).toBe(false)
    expect(admitsWay(way({ highway: 'residential', foot: 'no' }), DEFAULT_TAG_MAPPING, 'drive')).toBe(true)
    expect(
      admitsWay(way({ highway: 'residential', motor_vehicle: 'no' }), DEFAULT_TAG_MAPPING, 'drive'),
    ).toBe(false)
  })
})

describe('the alternative mappings differ where they claim to', () => {
  it('strict-drive drops service from the driving network only', () => {
    const w = way({ highway: 'service' })
    expect(admitsWay(w, STRICT_DRIVE_MAPPING, 'drive')).toBe(false)
    expect(admitsWay(w, STRICT_DRIVE_MAPPING, 'walk')).toBe(true)
  })

  it('narrow-walk drops path and steps from the walking network', () => {
    expect(admitsWay(way({ highway: 'path' }), NARROW_WALK_MAPPING, 'walk')).toBe(false)
    expect(admitsWay(way({ highway: 'steps' }), NARROW_WALK_MAPPING, 'walk')).toBe(false)
    expect(admitsWay(way({ highway: 'footway' }), NARROW_WALK_MAPPING, 'walk')).toBe(true)
  })
})

describe('the coverage classification', () => {
  it('counts only the pedestrian-only classes', () => {
    expect(isPedestrianOnly(way({ highway: 'footway' }))).toBe(true)
    expect(isPedestrianOnly(way({ highway: 'steps' }))).toBe(true)
    expect(isPedestrianOnly(way({ highway: 'residential' }))).toBe(false)
    expect(isPedestrianOnly(way({ highway: 'service' }))).toBe(false)
  })
})

describe('mapping lookup', () => {
  it('finds every shipped mapping by id and nothing else', () => {
    expect(tagMappingById('default')?.id).toBe('default')
    expect(tagMappingById('strict-drive')?.id).toBe('strict-drive')
    expect(tagMappingById('nope')).toBeUndefined()
  })

  it('never lets the walking network be a subset of the driving one', () => {
    // Every drivable class a pedestrian may use must also be walkable, or the
    // walk graph would be missing streets people plainly walk along.
    const shared = DEFAULT_TAG_MAPPING.drivable.filter(
      (highway) => highway !== 'motorway' && highway !== 'motorway_link',
    )
    for (const highway of shared) {
      expect(DEFAULT_TAG_MAPPING.walkable).toContain(highway)
    }
  })
})
