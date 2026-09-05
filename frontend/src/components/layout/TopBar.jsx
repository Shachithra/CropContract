import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import SyncBadge from '../common/SyncBadge.jsx'

export default function TopBar({ syncState = {} }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { online = true, syncing = false, pending = 0 } = syncState

  return (
    <header className="sticky top-0 z-30 bg-paddy/95 backdrop-blur border-b border-paddy/20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-3">
        <div />

        <div className="flex items-center gap-3">
          <SyncBadge online={online} syncing={syncing} pending={pending} />
          <LanguageToggle />
          {user && (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border border-white/20 bg-white/10 hover:border-turmeric/50 transition cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold uppercase bg-white/20 text-white">
                  {user.name?.[0] || '?'}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-[11px] text-white/60">{t(`roles.${user.role}`)}</p>
                </div>
              </button>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                title={t('nav.logout')}
                className="w-10 h-10 grid place-items-center rounded-xl border border-white/20 text-white/70 hover:text-clay hover:border-clay/50 transition"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
