import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Leaf, Home, LayoutDashboard, FileText, Store, FilePlus2, ClipboardCheck, AlertTriangle, BarChart3, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'

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

export default function DesktopSidebar({ className = '' }) {
  const { t } = useTranslation()
  const location = useLocation()
  const tabs = tabsByRole[useAuth()?.user?.role] || []

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
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition ${
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {t(label)}
            </NavLink>
          )
        })}
      </nav>

    </aside>
  )
}
