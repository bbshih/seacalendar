/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',   // Foam white
          100: '#e0f2fe',  // Light sky blue
          200: '#b9e6fe',  // Light cyan
          300: '#7dd3fc',  // Bright cyan
          400: '#38bdf8',  // Sky blue
          500: '#0ea5e9',  // Ocean blue (primary)
          600: '#0284c7',  // Deep ocean
          700: '#0369a1',  // Navy blue
          800: '#075985',  // Dark navy
          900: '#0c4a6e',  // Midnight blue
        },
        coral: {
          400: '#fb923c',  // Coral orange (accent)
          500: '#f97316',
        },
        sand: {
          100: '#fef3c7',  // Light sand
          200: '#fde68a',
          300: '#fcd34d',
        },
        seaweed: {
          500: '#10b981',  // Sea green
          600: '#059669',
        }
      },
      animation: {
        'wave': 'wave 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'ripple': 'ripple 0.6s linear',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
