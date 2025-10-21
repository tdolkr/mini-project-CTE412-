import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        slateglass: {
          950: '#0f172a',
          900: '#111c2e',
          800: '#1c2640',
          700: '#28314d'
        }
      },
      boxShadow: {
        glow: '0 25px 80px -30px rgba(56, 189, 248, 0.55)',
        innerGlow: 'inset 0 1px 0 rgba(148, 163, 184, 0.08)'
      },
      backdropBlur: {
        xxl: '32px'
      }
    }
  },
  plugins: []
};

export default config;
