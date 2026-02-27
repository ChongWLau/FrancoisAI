import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // François theme — warm cream page background
        cream: '#F8F5EE',
        // Navy — François's dark military coat
        navy: {
          50:  '#eef1f8',
          100: '#d5ddf0',
          200: '#a8c0e0',
          300: '#6b8fc4',
          400: '#4a74b2',
          500: '#3361A8', // French blue (tricolor sash)
          600: '#2a5291',
          700: '#1e3d6e',
          800: '#1C2B4A', // coat base — today highlight, nav accents
          900: '#131d32',
        },
        // Amber — François's jabot (ruffled cravat) — primary action color
        amber: {
          50:  '#fef9f4',
          100: '#fdf3e8',
          200: '#f9e4cc',
          300: '#f3c9a0',
          400: '#ebae7e',
          500: '#e09558',
          600: '#D4813A', // jabot base — primary buttons, links
          700: '#b86928',
          800: '#8f4e18',
          900: '#6a370f',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
