import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        squid: {
          ink:    '#ffffff',
          deep:   '#f8f5ff',
          ocean:  '#ede9fe',
          teal:   '#22c55e',
          cyan:   '#7c3aed',
          glow:   '#a78bfa',
          purple: '#6d28d9',
          'purple-light': '#7c3aed',
          violet: '#c4b5fd',
          amber:  '#f59e0b',
          coral:  '#ef4444',
          green:  '#22c55e',
          pink:   '#ec4899',
          slate:  '#f3f0ff',
          // Enhanced color palette
          'primary':    '#6d28d9',     // Deep purple
          'secondary':  '#0891b2',     // Cyan
          'accent':     '#f97316',     // Vibrant orange
          'success':    '#10b981',     // Emerald
          'warning':    '#f59e0b',     // Amber
          'danger':     '#ef4444',     // Red
          'neutral':    '#f3f4f6',     // Light gray
        },
        // override slate so border-slate-700 becomes soft lavender on light bg
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#e9e4ff',
          800: '#f0ebff',
          900: '#1e1b4b',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
      },
      fontSize: {
        'h1': ['2.5rem', { lineHeight: '3rem', fontWeight: '800', letterSpacing: '-0.02em' }],
        'h2': ['2rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'h4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(135deg, #f8f5ff 0%, #ede9fe 50%, #f0fdf4 100%)',
        'teal-glow':      'radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)',
        'squid-card':     'linear-gradient(145deg, #ffffff, #f8f5ff)',
        'gradient-primary': 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-cta': 'linear-gradient(135deg, #6d28d9 0%, #0891b2 100%)',
      },
      boxShadow: {
        'squid': '0 4px 24px rgba(124,58,237,0.12), 0 1px 4px rgba(0,0,0,0.04)',
        'glow':  '0 4px 20px rgba(167,139,250,0.25)',
        'coral': '0 4px 20px rgba(239,68,68,0.2)',
        'green': '0 4px 20px rgba(34,197,94,0.2)',
        'purple': '0 10px 30px rgba(109,40,217,0.15)',
        'card': '0 8px 32px rgba(0,0,0,0.08)',
        'card-hover': '0 12px 48px rgba(0,0,0,0.12)',
        'accent': '0 8px 24px rgba(249,115,22,0.15)',
      },
      animation: {
        'tentacle-wave': 'tentacleWave 2s ease-in-out infinite',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'score-pop':     'scorePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'shimmer':       'shimmer 2s infinite',
        'slide-up':      'slideUp 0.4s ease-out',
      },
      keyframes: {
        tentacleWave: {
          '0%, 100%': { transform: 'rotate(-5deg) scaleY(1)' },
          '50%':      { transform: 'rotate(5deg) scaleY(1.05)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', filter: 'brightness(1)' },
          '50%':      { opacity: '1',   filter: 'brightness(1.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        scorePop: {
          '0%':   { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '-1000px 0' },
          '50%': { backgroundPosition: '1000px 0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
