/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // PathMind design tokens
        slate: {
          925: '#0d1117',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'pulse-once': 'pulse 1s ease-in-out 1',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        pathmind: {
          "primary": "#2563eb",         // blue-600
          "primary-content": "#ffffff",
          "secondary": "#7c3aed",       // violet-600
          "secondary-content": "#ffffff",
          "accent": "#d97706",          // amber-600
          "accent-content": "#ffffff",
          "neutral": "#374151",         // gray-700
          "neutral-content": "#f9fafb",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
          "base-content": "#0f172a",
          "info": "#0ea5e9",
          "info-content": "#ffffff",
          "success": "#059669",         // emerald-600
          "success-content": "#ffffff",
          "warning": "#d97706",         // amber-600
          "warning-content": "#ffffff",
          "error": "#dc2626",
          "error-content": "#ffffff",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
