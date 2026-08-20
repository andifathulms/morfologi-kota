import type { Config } from 'tailwindcss'

/**
 * Tokens are DESIGN.md §1, §3, §7, §8. Components use these names only —
 * never a raw hex (CLAUDE.md, Conventions).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    // DESIGN.md §3 — monochrome plus exactly two hues. No red, no ramp.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      plate: '#FAF9F6',
      ink: '#14140F',
      rule: '#D8D5CC',
      drive: '#2A5D7C',
      walk: '#A85B32',
    },
    // DESIGN.md §1 — 4px base.
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
      24: '96px',
      32: '128px',
      px: '1px',
      full: '100%',
    },
    // DESIGN.md §7 — 1.25 ratio, floor 16px (14 is captions/citations only).
    fontSize: {
      xs: ['14px', '1.45'],
      base: ['16px', '1.55'],
      md: ['18px', '1.5'],
      lg: ['22px', '1.35'],
      xl: ['28px', '1.25'],
      '2xl': ['36px', '1.15'],
      '3xl': ['46px', '1.1'],
    },
    fontWeight: { normal: '400', semibold: '600' },
    borderRadius: { none: '0', DEFAULT: '2px', sm: '2px' }, // §1 — radius 2px only
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderWidth: { hairline: '0.5px' },
      transitionTimingFunction: { house: 'cubic-bezier(0.2,0,0,1)' },
      transitionDuration: { fast: '120ms', state: '240ms', draw: '600ms' },
      maxWidth: { plate: '1440px', prose: '68ch' },
    },
  },
  plugins: [],
}

export default config
