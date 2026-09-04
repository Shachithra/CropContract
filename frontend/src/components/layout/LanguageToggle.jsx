import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'si', label: 'සිං' },
  { code: 'ta', label: 'தமி' },
]

export default function LanguageToggle({ light = false }) {
  const { i18n } = useTranslation()

  return (
    <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${light ? 'bg-black/5' : 'bg-white/10'}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
            i18n.language === l.code
              ? light
                ? 'bg-turmeric text-paddy'
                : 'bg-turmeric text-white'
              : light
                ? 'text-paddy/60 hover:text-paddy hover:bg-black/5'
                : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
