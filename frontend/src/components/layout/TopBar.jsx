import { Leaf, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import SyncBadge from '../common/SyncBadge.jsx'

const roleColor = {
  farmer: 'bg-paddy text-white',
  buyer: 'bg-turmeric text-white',
  officer: 'bg-teal text-white',
}

export default function TopBar({ syncState = {} }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { online = true, syncing = false, pending = 0 } = syncState

  return (
    <header className="sticky top-0 z-30 bg-paddy/95 backdrop-blur border-b border-paddy/20">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Mobile: show logo + name. Desktop: sidebar handles it */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-display font-bold tracking-tight md:hidden"
        >
          <span className="w-8 h-8 rounded-lg bg-turmeric grid place-items-center">
            <Leaf size={17} className="text-white" />
          </span>
          <span className="text-white">{t('appName')}</span>
        </button>
        {/* Desktop: spacer to push controls right */}
        <div className="hidden md:block flex-1" />

        <div className="flex items-center gap-2.5">
          <SyncBadge online={online} syncing={syncing} pending={pending} />
          <LanguageToggle />
          {user && (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-paddy/30 bg-paddy/20 hover:border-turmeric/50 transition cursor-pointer"
              >
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold uppercase ${roleColor[user.role] || 'bg-paddy text-white'}`}
                >
                  {user.name?.[0] || '?'}
                </span>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-white">{user.name}</p>
                  <p className="text-[10px] text-cream/70">{t(`roles.${user.role}`)}</p>
                </div>
              </button>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                title={t('nav.logout')}
                className="w-9 h-9 grid place-items-center rounded-xl border border-paddy/30 text-cream/70 hover:text-clay hover:border-clay/50 transition"
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
