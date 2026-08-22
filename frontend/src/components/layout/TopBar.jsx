import { Leaf, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.jsx'
import LanguageToggle from './LanguageToggle.jsx'

const roleColor = {
  farmer: 'bg-emerald text-forest',
  buyer: 'bg-gold text-forest',
  officer: 'bg-mint text-forest',
}

export default function TopBar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 bg-forest/90 backdrop-blur border-b border-surface-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-display font-bold tracking-tight"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald/15 border border-emerald/40 grid place-items-center">
            <Leaf size={17} className="text-emerald" />
          </span>
          <span className="text-textmain">{t('appName')}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-surface-border bg-surface">
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold uppercase ${roleColor[user.role] || 'bg-mint text-forest'}`}
                >
                  {user.name?.[0] || '?'}
                </span>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-textmain">{user.name}</p>
                  <p className="text-[10px] text-textmuted">{t(`roles.${user.role}`)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                title={t('nav.logout')}
                className="w-9 h-9 grid place-items-center rounded-xl border border-surface-border text-textmuted hover:text-alert hover:border-alert/50 transition"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
