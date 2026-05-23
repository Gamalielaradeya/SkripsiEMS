/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // EMS Brand colors
        ems: {
          50:  '#f0faf4',
          100: '#dcf5e5',
          200: '#bbe9cc',
          300: '#86d6a7',
          400: '#4dba7f',
          500: '#29a05f',
          600: '#1a844b',
          700: '#176940',
          800: '#165335',
          900: '#13442d',
        },
        // Status colors
        status: {
          normal:  '#22c55e',
          waspada: '#f59e0b',
          anomali: '#ef4444',
          trouble: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
