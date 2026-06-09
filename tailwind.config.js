/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        // scale(0.97) start = nothing appears from nowhere
        'slide-up':        'slideUp 0.22s cubic-bezier(0.23, 1, 0.32, 1) both',
        // toast handled via CSS transitions; keep for legacy references
        'slide-in-right':  'slideInRight 0.28s cubic-bezier(0.23, 1, 0.32, 1) both',
        'fade-in':         'fadeIn 0.18s ease-out both',
        'pulse-slow':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'highlight':       'highlight 2s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(8px) scale(0.97)', opacity: '0' },
          '100%': { transform: 'translateY(0)   scale(1)',    opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        highlight: {
          '0%':   { backgroundColor: '#fef08a' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
