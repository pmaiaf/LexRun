/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0F1E30',
          800: '#1B2E4B',
          700: '#243D62',
          600: '#2D4C79',
          100: '#EEF2F8',
          50:  '#F5F8FD',
        },
        accent: {
          600: '#0C7A75',
          500: '#0EA5A0',
          100: '#E0F5F4',
        },
        gold: {
          600: '#9C7539',
          500: '#B8935A',
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
