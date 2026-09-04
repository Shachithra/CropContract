import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Leaf, LogOut, Home, LayoutDashboard, FileText, Store, FilePlus2, ClipboardCheck, AlertTriangle, BarChart3, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import LanguageToggle from './LanguageToggle.jsx'

const tabsByRole = {
  farmer: [
    { to: '/farmer', icon: Home, label: 'nav.home' },
    { to: '/marketplace', icon: Store, label: 'nav.market' },
    { to: '/farmer/contracts', icon: FileText, label: 'nav.contracts' },
    { to: '/farmer/alerts', icon: AlertTriangle, label: 'nav.alerts' },
    { to: '/profile', icon: User, label: 'nav.profile' },
  ],
  buyer: [
    { to: '/buyer', icon: LayoutDashboard, label: 'nav.dashboard' },
    { to: '/marketplace', icon: Store, label: 'nav.market' },
    { to: '/buyer/post', icon: FilePlus2, label: 'nav.post' },
    { to: '/buyer/fulfilment', icon: FileText, label: 'nav.fulfilment' },
    { to: '/profile', icon: User, label: 'nav.profile' },
  ],
  officer: [
    { to: '/officer', icon: ClipboardCheck, label: 'nav.review' },
    { to: '/officer/outbreaks', icon: BarChart3, label: 'nav.outbreaks' },
    { to: '/officer/alert', icon: AlertTriangle, label: 'nav.issueAlert' },
    { to: '/profile', icon: User, label: 'nav.profile' },
  ],
}

const roleColor = {
  farmer: 'bg-paddy text-white',
  buyer: 'bg-turmeric text-white',
  officer: 'bg-teal text-white',
}

export default function DesktopSidebar({ className = '' }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const location = useLocation()
  const tabs = tabsByRole[user?.role] || []

  return (
    <aside className={`hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-paddy text-white z-40 ${className}`}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <span className="w-9 h-9 rounded-lg bg-turmeric grid place-items-center shrink-0">
          <Leaf size={18} className="text-white" />
        </span>
        <span className="font-display font-bold text-base tracking-tight">{t('appName')}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active =
            to === '/farmer' || to === '/buyer' || to === '/officer'
              ? location.pathname === to
              : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              {t(label)}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <LanguageToggle />

        {user && (
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold uppercase shrink-0 ${roleColor[user.role] || 'bg-white/20 text-white'}`}
            >
              {user.name?.[0] || '?'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/50">{t(`roles.${user.role}`)}</p>
            </div>
            <button
              onClick={() => {
                logout()
                window.location.href = '/login'
              }}
              title={t('nav.logout')}
              className="w-8 h-8 grid place-items-center rounded-lg text-white/50 hover:text-clay hover:bg-white/10 transition shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
