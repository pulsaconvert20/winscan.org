/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark Mode Theme
        background: '#0f0f0f',
        foreground: '#ffffff',
        primary: '#3b82f6',
        'primary-text': '#ffffff',
        'primary-container': '#2563eb',
        secondary: '#8b5cf6',
        surface: '#1a1a1a',
        'surface-text': '#ffffff',
        'surface-variant': '#262626',
        'surface-variant-text': '#e5e5e5',
        'surface-tint': '#3b82f6',
        outline: '#525252',
        'surface-container': '#1a1a1a',
        'surface-container-high': '#262626',
        'surface-container-highest': '#333333',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      keyframes: {
        slideIn: {
          '0%': { 
            transform: 'translateX(-10px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      animation: {
        slideIn: 'slideIn 0.5s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    },
  },
  plugins: [],
}

