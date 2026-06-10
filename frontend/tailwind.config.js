/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Matte English Orange palette
        orange: {
          50:  '#FDF4EC',
          100: '#FAE3CE',
          200: '#F5C49D',
          300: '#EDA06B',
          400: '#E27A38',
          500: '#C65E1A',  // primary — matte English orange
          600: '#A34B14',
          700: '#7E390F',
          800: '#5A280A',
          900: '#361806',
          950: '#1E0D03',
        },
        // Dark surface scale
        zinc: {
          925: '#111111',
          950: '#0C0C0C',
          975: '#080808',
        },
        surface: {
          base:     '#0C0C0C',
          raised:   '#141414',
          elevated: '#1C1C1C',
          overlay:  '#242424',
          border:   '#2A2A2A',
          'border-subtle': '#1E1E1E',
        },
        text: {
          primary:   '#EBEBEB',
          secondary: '#8A8A8A',
          muted:     '#555555',
          inverse:   '#0C0C0C',
        },
        status: {
          success: '#2D7D46',
          'success-dim': '#1A3D26',
          warning: '#8A6C1A',
          'warning-dim': '#3A2D0A',
          error:   '#8A2020',
          'error-dim': '#3A1010',
          info:    '#1A4E8A',
          'info-dim': '#0A2040',
        }
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'fade-in':        'fade-in 0.25s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.2s ease-out forwards',
        'pulse-dot':      'pulse-dot 1.4s ease-in-out infinite',
        'pulse-dot-2':    'pulse-dot 1.4s ease-in-out 0.2s infinite',
        'pulse-dot-3':    'pulse-dot 1.4s ease-in-out 0.4s infinite',
        'blink':          'blink 1s step-end infinite',
        'spin-slow':      'spin-slow 2s linear infinite',
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(198, 94, 26, 0.15)',
        'orange-glow-sm': '0 0 10px rgba(198, 94, 26, 0.1)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
