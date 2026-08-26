/**
 * The palette, recomputed rather than remembered.
 *
 * `globals.css` writes a measured contrast ratio beside every colour token,
 * because a muted step whose contrast nobody wrote down is how `text-ink/50`
 * once shipped at 3.5:1. Writing it down is half the guard; this is the other
 * half. Every ratio in that file is recomputed here from the hex sitting next
 * to it, so a token and its comment cannot drift apart — which is the failure
 * the comment alone could never catch, since a colour can be edited and its
 * number left behind and the page still renders.
 *
 * It also asserts the ladder itself (DESIGN.md §3): six neutral rungs, each
 * clearing the threshold for the job it does, in strictly descending order.
 * One rung sits below 3:1 on purpose and is named here, so that adding a
 * second one is a test failure rather than a habit.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

/** WCAG 2.1 relative luminance. */
function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

/** The `:root` block only — the increased-contrast block is read separately. */
function block(after: string): string {
  const start = css.indexOf(after)
  expect(start, `${after} is missing from globals.css`).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('\n}', start))
}

function tokens(source: string): Map<string, string> {
  const found = new Map<string, string>()
  for (const match of source.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/g)) {
    const name = match[1]
    const value = match[2]
    if (name !== undefined && value !== undefined) found.set(name, value)
  }
  return found
}

/** The ratio written in the comment beside a token, where there is one. */
function declared(source: string, token: string): number | undefined {
  const match = new RegExp(`--${token}:[^;]+;\\s*/\\*\\s*([\\d.]+):1`).exec(source)
  return match?.[1] === undefined ? undefined : Number(match[1])
}

const root = block(':root {')
const contrastMore = block('@media (prefers-contrast: more)')
const base = tokens(root)
const more = tokens(contrastMore)
const PLATE = base.get('plate') ?? '#f7f4ec'

/* The ladder, and the threshold each rung is used at. DESIGN.md §3. */
const LADDER: readonly { token: string; least: number; role: string }[] = [
  { token: 'ink', least: 4.5, role: 'text' },
  { token: 'ink-muted', least: 4.5, role: 'long-form prose' },
  { token: 'ink-subtle', least: 4.5, role: 'labels, units, captions' },
  { token: 'rule-strong', least: 3, role: 'structural boundaries' },
  { token: 'rule', least: 3, role: 'informative hairlines' },
]

describe('the declared ratios', () => {
  it('are written beside every colour but the sheet itself', () => {
    for (const [name, value] of base) {
      if (name === 'plate') continue
      expect(declared(root, name), `--${name} (${value}) has no measured ratio`).toBeDefined()
    }
  })

  it('are what the colours actually measure', () => {
    for (const [name, value] of base) {
      if (name === 'plate') continue
      const written = declared(root, name)
      if (written === undefined) continue
      const measured = contrast(value, PLATE)
      expect(
        Math.abs(measured - written),
        `--${name} is ${value}, which measures ${measured.toFixed(2)}:1, not the ${written}:1 written beside it`,
      ).toBeLessThan(0.06)
    }
  })
})

describe('the neutral ladder', () => {
  it('clears the threshold for the job each rung does', () => {
    for (const rung of LADDER) {
      const value = base.get(rung.token)
      expect(value, `--${rung.token} is missing`).toBeDefined()
      if (value === undefined) continue
      expect(
        contrast(value, PLATE),
        `--${rung.token} is used for ${rung.role} and must clear ${rung.least}:1`,
      ).toBeGreaterThanOrEqual(rung.least)
    }
  })

  it('descends, so every rung is a step and not a synonym', () => {
    const ratios = [...LADDER, { token: 'rule-faint', least: 0, role: 'row separators' }].map(
      (rung) => contrast(base.get(rung.token) ?? PLATE, PLATE),
    )
    for (let i = 1; i < ratios.length; i += 1) {
      expect(ratios[i] ?? 0, 'the ladder must descend').toBeLessThan(ratios[i - 1] ?? 0)
    }
  })

  it('has exactly one rung below 3:1, and it is the decorative one', () => {
    const quiet = [...base.entries()]
      .filter(([name]) => name !== 'plate')
      .filter(([, value]) => contrast(value, PLATE) < 3)
      .map(([name]) => name)
    expect(quiet).toEqual(['rule-faint'])
  })
})

describe('the two hues', () => {
  it('both clear AA on the sheet at the sizes they are used', () => {
    for (const hue of ['drive', 'walk']) {
      const value = base.get(hue)
      expect(value, `--${hue} is missing`).toBeDefined()
      if (value !== undefined) expect(contrast(value, PLATE)).toBeGreaterThanOrEqual(4.5)
    }
  })

  /*
   * The one number in this file that is allowed to fail its threshold, and it
   * is why the product draws a shape cue at all. If this ever rises above 3:1
   * the outline on walk stops being load-bearing — which would be good news,
   * and is a decision to take in DESIGN.md §3 rather than a change to make
   * quietly. Either way the figure is recorded here.
   */
  it('are still not separable from each other by luminance', () => {
    const drive = base.get('drive') ?? PLATE
    const walk = base.get('walk') ?? PLATE
    expect(contrast(drive, walk)).toBeLessThan(3)
  })
})

describe('increased contrast', () => {
  it('is a step up from every base value it overrides', () => {
    for (const [name, value] of more) {
      const baseValue = base.get(name)
      if (baseValue === undefined) continue
      expect(
        contrast(value, PLATE),
        `--${name} under prefers-contrast: more must be darker than the base value`,
      ).toBeGreaterThan(contrast(baseValue, PLATE))
    }
  })

  it('overrides something, or the media query is decoration', () => {
    expect(more.size).toBeGreaterThan(0)
  })
})
