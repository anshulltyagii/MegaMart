/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'], // Headings
      },
      colors: {
        background: '#F8F9FA', // Very light grey-white (easier on eyes than pure white)
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#111827', // Almost black (Luxury feel)
          hover: '#374151',
        },
        accent: {
          DEFAULT: '#4F46E5', // Indigo-600
          glow: '#818CF8',
        },
      },
      boxShadow: {
        'soft': '0 4px 30px rgba(0, 0, 0, 0.03)',
        'card': '0 10px 40px -10px rgba(0,0,0,0.05)',
        'glow': '0 0 20px rgba(79, 70, 229, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}