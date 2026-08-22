/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#061912',
        surface: {
          DEFAULT: '#102A20',
          border: '#1B3E30',
        },
        emerald: {
          DEFAULT: '#10B981',
          deep: '#059669',
        },
        mint: '#34D399',
        gold: '#F59E0B',
        alert: '#EF4444',
        textmain: '#F0FDF4',
        textmuted: '#86EFAC',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Noto Sans', 'sans-serif'],
        body: ['Noto Sans', 'Noto Sans Sinhala', 'Noto Sans Tamil', 'sans-serif'],
      },
      backgroundImage: {
        'emerald-mint': 'linear-gradient(90deg, #10B981, #34D399)',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.35)',
        glow: '0 0 24px rgba(16,185,129,0.25)',
      },
    },
  },
  plugins: [],
}
