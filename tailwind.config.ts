import type { Config } from 'tailwindcss'

/**
 * Tokens are DESIGN.md §1, §3, §7, §8. Components use these names only —
 * never a raw hex (CLAUDE.md, Conventions).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    /*
     * Every value here resolves to a custom property declared in
     * `app/globals.css`. That is the point: the SVG drawings and the generated
     * sort rules read the properties directly, so if the theme carried literal
     * values the two layers could disagree — and under `prefers-contrast` they
     * used to, which is why that block needed `!important` overrides.
     */
    // DESIGN.md §3 — monochrome plus exactly two hues. No red, no ramp.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      plate: 'var(--plate)',
      ink: 'var(--ink)',
      'ink-muted': 'var(--ink-muted)',
      'ink-subtle': 'var(--ink-subtle)',
      'rule-strong': 'var(--rule-strong)',
      rule: 'var(--rule)',
      'rule-faint': 'var(--rule-faint)',
      drive: 'var(--drive)',
      walk: 'var(--walk)',
    },
    // DESIGN.md §1 — 4px base.
    spacing: {
      0: '0px',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      6: 'var(--space-6)',
      8: 'var(--space-8)',
      12: 'var(--space-12)',
      16: 'var(--space-16)',
      24: 'var(--space-24)',
      32: 'var(--space-32)',
      px: '1px',
      full: '100%',
    },
    // DESIGN.md §7 — 1.25 ratio, floor 16px (14 is captions/citations only).
    fontSize: {
      xs: ['var(--text-xs)', '1.45'],
      base: ['var(--text-base)', '1.55'],
      md: ['var(--text-md)', '1.5'],
      lg: ['var(--text-lg)', '1.35'],
      xl: ['var(--text-xl)', '1.25'],
      '2xl': ['var(--text-2xl)', '1.15'],
      '3xl': ['var(--text-3xl)', '1.1'],
    },
    fontWeight: { normal: '400', semibold: '600' },
    borderRadius: { none: '0', DEFAULT: '2px', sm: '2px' }, // §1 — radius 2px only
    // §1 — hairline 0.5px is the edge in the house layer, so it is the default
    // width rather than something a component has to remember to ask for.
    borderWidth: { DEFAULT: '0.5px', 0: '0px', hairline: '0.5px', 2: '2px' },
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: { house: 'cubic-bezier(0.2,0,0,1)' },
      transitionDuration: { fast: '120ms', state: '240ms', draw: '600ms' },
      maxWidth: { plate: '1440px', prose: '68ch' },
    },
  },
  plugins: [],
}

export default config
