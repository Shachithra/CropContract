import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'si', label: 'සිං' },
  { code: 'ta', label: 'தமி' },
]

export default function LanguageToggle() {
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center gap-0.5 bg-paddy/20 rounded-lg p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
            i18n.language === l.code
              ? 'bg-turmeric text-white'
              : 'text-cream/70 hover:text-white'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
