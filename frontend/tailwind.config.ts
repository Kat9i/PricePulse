import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',
        'primary-light': '#a29bfe',
        success: '#00B894',
        danger: '#D63031',
        bg: '#F5F4FF',
        surface: '#FFFFFF',
        'text-main': '#2D3436',
        'text-muted': '#636E72',
        border: '#EDEDF5',
        wb: '#CB11AB',
        ozon: '#0069FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        sheet: '24px',
        badge: '6px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(108,92,231,0.08)',
        fab: '0 4px 20px rgba(108,92,231,0.4)',
        sheet: '0 -4px 24px rgba(108,92,231,0.10)',
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
    },
  },
  plugins: [],
} satisfies Config
