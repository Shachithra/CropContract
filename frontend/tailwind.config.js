/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paddy: '#2F5233',
        turmeric: '#E3A008',
        clay: '#B5533C',
        cream: '#EFE9D8',
        indigo: '#263A52',
        teal: '#1F7A5C',
        'text-muted': '#6B6558',
        /* Legacy aliases for gradual migration */
        forest: '#2F5233',
        surface: {
          DEFAULT: '#E8E0CC',
          border: '#D4C9B0',
        },
        emerald: {
          DEFAULT: '#1F7A5C',
          deep: '#165C44',
        },
        mint: '#1F7A5C',
        gold: '#E3A008',
        alert: '#B5533C',
        textmain: '#2F5233',
        textmuted: '#6B6558',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Noto Sans', 'sans-serif'],
        body: ['Noto Sans', 'Noto Sans Sinhala', 'Noto Sans Tamil', 'sans-serif'],
      },
      backgroundImage: {
        'emerald-mint': 'linear-gradient(90deg, #E3A008, #D4940A)',
      },
      boxShadow: {
        card: '0 2px 8px rgba(47, 82, 51, 0.08)',
        raised: '0 4px 16px rgba(47, 82, 51, 0.12)',
        glow: '0 0 24px rgba(227, 160, 8, 0.25)',
      },
    },
  },
  plugins: [],
}
