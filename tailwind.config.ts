import type { Config } from 'tailwindcss'

/**
 * Tailwind theme — tokens transcribed from design-reference/colors_and_type.css.
 * Defaults are intentionally REPLACED (not extended) for colors so Tailwind's
 * built-in blue/slate/zinc ramps cannot leak into the UI. See docs/constitution.md §6.
 */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      canvas: { DEFAULT: '#F6F7F9', 2: '#ECEEF2', dark: '#0C1022' },
      ink: {
        DEFAULT: '#161A33',
        2: '#5A6072',
        3: '#8B91A1',
        onDark: '#F6F7F9',
        onDark2: '#A8AEC4',
      },
      hairline: { DEFAULT: '#E2E5EB', dark: '#2A3060' },
      surface: { dark: '#161A33', dark2: '#1F2547' },

      accent: {
        DEFAULT: '#FF4D2E',
        ink: '#161A33',
        strong: '#D9381C',
      },

      // Functional / data only — used exclusively to signal podium rank.
      gold: { DEFAULT: '#F2B100', ink: '#161A33' },
      silver: { DEFAULT: '#B9C0CC', ink: '#161A33' },
      bronze: { DEFAULT: '#C77B3B', ink: '#FFFFFF' },
    },

    fontFamily: {
      display: ['"Clash Display"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
      body: ['"Geist"', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
    },

    fontSize: {
      'display-xl': ['clamp(48px, 8vw, 96px)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
      'display-l': ['clamp(36px, 6vw, 64px)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
      h1: ['clamp(28px, 4.2vw, 40px)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
      h2: ['clamp(22px, 3vw, 28px)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      h3: ['20px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      h4: ['16px', { lineHeight: '1.3' }],
      body: ['15px', { lineHeight: '1.55' }],
      'body-sm': ['13px', { lineHeight: '1.5' }],
      caption: ['12px', { lineHeight: '1.4' }],
      eyebrow: ['11px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
      score: ['clamp(40px, 6vw, 72px)', { lineHeight: '1', letterSpacing: '-0.01em' }],
    },

    extend: {
      spacing: {
        s1: '4px',
        s2: '8px',
        s3: '16px',
        s4: '24px',
        s5: '32px',
        s6: '48px',
        s7: '64px',
        s8: '96px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        pill: '999px',
        thumb: '9999px', // 128×128 hero portraits are circular per clarification
      },
      maxWidth: { content: '1200px' },
      transitionTimingFunction: {
        pa: 'cubic-bezier(.2,.8,.2,1)',
        'pa-out': 'cubic-bezier(.16,1,.3,1)',
      },
      transitionDuration: { fast: '120ms', base: '200ms', slow: '320ms' },
    },
  },
  plugins: [],
} satisfies Config
