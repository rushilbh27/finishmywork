/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // surfaces via CSS variables
        background: 'var(--bg)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        border: 'var(--border)',
        foreground: 'var(--text)',
        muted: {
          DEFAULT: 'var(--muted)',
        },
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: 'var(--accent)',
        },
        // semantic statuses
        success: '#10B981',
        warning: '#F59E0B',
        slatey: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
      },
      boxShadow: {
        glow: '0 12px 30px rgba(109, 40, 217, 0.18)',
        'glow-hover': '0 16px 40px rgba(109, 40, 217, 0.28)',
        card: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.25)'
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(90deg, var(--accent-from), var(--accent-to))',
        'gradient-subtle': 'radial-gradient(1200px 600px at 10% -10%, rgba(109,40,217,0.15), transparent 60%), radial-gradient(1200px 600px at 90% -20%, rgba(139,92,246,0.12), transparent 60%)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms soft both',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
