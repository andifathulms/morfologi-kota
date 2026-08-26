/**
 * The scale, and the two roles that sit under the body floor.
 *
 * DESIGN.md §7 states a floor of 16 for anything a reader is expected to
 * read, a metric size of 15, and a label role of 13 that is never prose and
 * never interactive. The first is a rule a component can break silently, and
 * the last two are new — so both the numbers and the one usage rule that
 * matters are asserted here rather than left to review.
 *
 * The metric size is the point of the change. Ten mono rows read down and
 * compared across sixteen cards were set at 14, two steps below prose nobody
 * has to compare at all: the densest text in the product was also the
 * smallest. If it ever drops back, this fails.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

function px(token: string): number {
  const match = new RegExp(`--${token}:\\s*(\\d+(?:\\.\\d+)?)px`).exec(css)
  expect(match, `--${token} is missing from globals.css`).not.toBeNull()
  return Number(match?.[1] ?? 0)
}

function unitless(token: string): number {
  const match = new RegExp(`--${token}:\\s*(\\d+(?:\\.\\d+)?);`).exec(css)
  expect(match, `--${token} is missing from globals.css`).not.toBeNull()
  return Number(match?.[1] ?? 0)
}

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sources(full)
    return full.endsWith('.tsx') ? [full] : []
  })
}

const files = [...sources(join(process.cwd(), 'app')), ...sources(join(process.cwd(), 'components'))]

describe('the type scale', () => {
  const scale = ['text-2xs', 'text-xs', 'text-base', 'text-md', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl']

  it('ascends, with no two steps the same size', () => {
    const sizes = scale.map((name) => px(name.replace('text-', 'text-')))
    for (let i = 1; i < sizes.length; i += 1) {
      expect(sizes[i] ?? 0, `${scale[i]} must be larger than ${scale[i - 1]}`).toBeGreaterThan(
        sizes[i - 1] ?? 0,
      )
    }
  })

  it('keeps the body floor at 16', () => {
    expect(px('text-base')).toBeGreaterThanOrEqual(16)
  })

  it('sets the metric size at 15 or above, so the densest text is not the smallest', () => {
    expect(px('text-xs')).toBeGreaterThanOrEqual(15)
  })

  it('has exactly one step below the metric size, and it is the label role', () => {
    const below = ['text-2xs', 'text-xs', 'text-base', 'text-md'].filter(
      (name) => px(name) < px('text-xs'),
    )
    expect(below).toEqual(['text-2xs'])
  })
})

describe('the leadings', () => {
  it('are two, and prose is the airier of them', () => {
    expect(unitless('lead-prose')).toBeGreaterThan(unitless('lead-note'))
  })
})

describe('the label role', () => {
  /*
   * A label names a thing; prose is read. The two must not share a size, and
   * the smallest type in the product is the one place the distinction is
   * easiest to lose — `text-2xs` on a serif element is a sentence set at 13.
   */
  it('is never set in the prose face', () => {
    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8')
      return [...source.matchAll(/className="([^"]*)"/g)].some((match) => {
        const value = match[1] ?? ''
        return value.includes('text-2xs') && value.includes('font-serif')
      })
    })
    expect(offenders).toEqual([])
  })

  it('is used, or the token is decoration', () => {
    const used = files.some((file) => readFileSync(file, 'utf8').includes('text-2xs'))
    expect(used).toBe(true)
  })
})
