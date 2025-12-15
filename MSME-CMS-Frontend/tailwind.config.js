/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          '50': '#f0f7ff',
          '100': '#e0effe',
          '200': '#b9dffe',
          '300': '#7cc7fd',
          '400': '#36adfa',
          '500': '#0c94eb',
          '600': '#0075c9',
          '700': '#015da4',
          '800': '#064e87',
          '850': '#e6e9ee',
          '900': '#0b4270',
          '950': '#2E458D',  
        },
        'accent': {
          '500': '#f8a92b',  
        }
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
      }
    },
  },
  plugins: [],
}