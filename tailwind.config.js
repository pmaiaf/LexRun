/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0A1C3A',
          800: '#0F2547',
          700: '#243D62',
          600: '#2D4C79',
          200: '#C9D5E8',
          100: '#EEF3FA',
          50:  '#F4F6FB',
        },
        accent: {
          600: '#0C7A75',
          500: '#0EA5A0',
          100: '#E0F5F4',
        },
        gold: {
          600: '#C39A2E',
          500: '#D4AF37',
          400: '#F0D27A',
          100: '#F3E9D8',
        },
        paper: '#FAF8F4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
