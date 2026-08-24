/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SkinStreak brand palette
        coral: {
          50:  '#fff1f0',
          100: '#ffe0dd',
          200: '#ffc5bf',
          300: '#ff9f96',
          400: '#ff6b6b',   // primary brand accent
          500: '#f93a3a',
          600: '#e61a1a',
          700: '#c21212',
          800: '#a01212',
          900: '#841616',
        },
        cream: {
          50:  '#ffffff',
          100: '#fff9f2',
          200: '#fff5e4',   // page background
          300: '#ffeac8',
          400: '#ffd9a0',
          500: '#ffc670',
        },
        sage: {
          50:  '#f0f7ee',
          100: '#dceedb',
          200: '#b8dcb5',
          300: '#a8d5a2',   // secondary accent
          400: '#78be70',
          500: '#50a046',
          600: '#3d7e34',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft:    '#fafafa',
        },
        // Typography colours — generates text-text-dark, text-text-mid, text-text-soft etc.
        text: {
          dark: '#1a1a2e',
          mid:  '#4a4a6a',
          soft: '#8888aa',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card':   '0 4px 24px 0 rgba(255, 107, 107, 0.10)',
        'glow':   '0 0 30px 0 rgba(255, 107, 107, 0.25)',
        'subtle': '0 2px 12px 0 rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out both',
        'slide-up':   'slideUp 0.5s ease-out both',
        'scale-up':   'scaleUp 0.3s ease-out both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
