/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      // Notion-like warm grays; 900 is Notion's body text color.
      colors: {
        gray: {
          50: '#FBFBFA',
          100: '#F7F7F5',
          200: '#EDEDEB',
          300: '#E3E2E0',
          400: '#B9B8B5',
          500: '#91918E',
          600: '#787774',
          700: '#5F5E5B',
          800: '#45443F',
          900: '#37352F',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
