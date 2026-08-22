import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'si', label: 'සිං' },
  { code: 'ta', label: 'தமி' },
]

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage?.slice(0, 2) || 'en'

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-surface-border bg-surface p-0.5">
      <Globe size={13} className="text-textmuted ml-1.5 mr-0.5" />
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide transition ${
            current === code ? 'bg-emerald text-forest' : 'text-textmuted hover:text-mint'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
