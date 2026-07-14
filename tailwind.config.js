/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        graphite: {
          50: '#f6f6f7',
          100: '#e1e3e5',
          200: '#c3c6ca',
          300: '#9da1a8',
          400: '#787c85',
          500: '#5e626a',
          600: '#4b4e55',
          700: '#3f4147',
          800: '#34363b',
          900: '#2d2f33',
          950: '#1a1b1e',
        }
      },
      borderRadius: {
        'mac': '10px',
      },
      boxShadow: {
        'mac': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'mac-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Microsoft YaHei"', '"PingFang SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
