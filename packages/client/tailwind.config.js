/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'majority-glow': 'majority-glow 1.6s ease-in-out infinite',
      },
      keyframes: {
        'majority-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(2, 132, 199, 0.0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(2, 132, 199, 0.45)' },
        },
      },
    },
  },
  plugins: [],
};

