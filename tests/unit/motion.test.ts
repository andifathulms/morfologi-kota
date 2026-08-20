/**
 * The drawing must survive its own animation.
 *
 * `.network-ink` declares a hidden resting state — a full dash offset — and
 * relies on the keyframe to reveal it. With `animation-fill-mode: backwards`
 * that state is handed back the moment the animation ends, so every network
 * draws for 600 ms and then erases itself, leaving twelve empty circles on the
 * plate. It shipped that way once. This is the guard.
 *
 * The rest of the suite could not catch it: the markup was correct, the audit
 * found nothing, and reduced-motion users saw the drawings perfectly, because
 * that media query overrides the offset to zero.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`)
  expect(start, `${selector} is missing from globals.css`).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('}', start))
}

describe('the network drawing', () => {
  const rule = ruleBody('.network-ink')

  it('hides itself before the animation, so it can be drawn', () => {
    expect(rule).toContain('stroke-dashoffset: 1')
  })

  it('keeps its end state after the animation, or the ink disappears', () => {
    const fillMode = /animation:[^;]*\b(both|forwards|backwards|none)\b/.exec(rule)?.[1]
    expect(
      fillMode,
      'a hidden resting state needs a fill mode that persists the end state',
    ).toBeDefined()
    expect(['both', 'forwards']).toContain(fillMode)
  })
})

describe('the rose', () => {
  const rule = ruleBody('.rose-bar')

  it('grows from the origin of its own viewBox', () => {
    expect(rule).toContain('transform-origin: 0 0')
    expect(rule).toContain('transform-box: view-box')
  })

  it('needs no fill mode, because its resting state is the drawn one', () => {
    // The bins carry no persistent transform in CSS, so `backwards` is right
    // here: it holds the collapsed state through the per-bin delay and then
    // gets out of the way.
    expect(rule).toMatch(/animation:[^;]*backwards/)
  })
})

describe('reduced motion', () => {
  it('renders both complete and instant rather than degraded', () => {
    const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
    expect(start).toBeGreaterThan(-1)
    const block = css.slice(start, css.indexOf('\n}', css.indexOf('*,', start)))
    expect(block).toContain('stroke-dashoffset: 0 !important')
    expect(block).toContain('animation: none !important')
  })
})
