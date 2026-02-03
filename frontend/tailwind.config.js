/** @type {import('tailwindcss').Config} */
<<<<<<< HEAD
export default {
=======
module.exports = {
>>>>>>> 69f9136 (Initial commit)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#050509',
        surface: '#0b0b10',
        primary: '#e53935',
        secondary: '#ff6b81',
<<<<<<< HEAD
=======
        text: {
          primary: '#f9fafb',
          secondary: '#9ca3af'
        }
>>>>>>> 69f9136 (Initial commit)
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'slideUp': 'slideUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translate(-50%, 100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
<<<<<<< HEAD
}
=======
}
>>>>>>> 69f9136 (Initial commit)
