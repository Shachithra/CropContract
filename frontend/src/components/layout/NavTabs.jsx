import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, LayoutDashboard, Leaf, ScanLine, Store, FilePlus2, ClipboardCheck, AlertTriangle, BarChart3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'

const tabsByRole = {
  farmer: [
    { to: '/farmer', icon: Home, label: 'nav.home' },
    { to: '/marketplace', icon: Store, label: 'nav.marketplace' },
    { to: '/farmer/contracts', icon: Leaf, label: 'nav.myContracts' },
    { to: '/farmer/scan', icon: ScanLine, label: 'nav.scan' },
  ],
  buyer: [
    { to: '/buyer', icon: LayoutDashboard, label: 'nav.dashboard' },
    { to: '/marketplace', icon: Store, label: 'nav.marketplace' },
    { to: '/buyer/post', icon: FilePlus2, label: 'nav.post' },
    { to: '/buyer/fulfilment', icon: Leaf, label: 'nav.fulfilment' },
  ],
  officer: [
    { to: '/officer', icon: ClipboardCheck, label: 'nav.review' },
    { to: '/officer/outbreaks', icon: BarChart3, label: 'nav.outbreaks' },
    { to: '/officer/alert', icon: AlertTriangle, label: 'nav.issueAlert' },
    { to: '/marketplace', icon: Store, label: 'nav.marketplace' },
  ],
}

export default function NavTabs() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const tabs = tabsByRole[user?.role] || []

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-surface-border pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-5xl mx-auto flex">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active =
            to === '/farmer' || to === '/buyer' || to === '/officer'
              ? location.pathname === to
              : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              replace={false}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                active ? 'text-paddy' : 'text-text-muted hover:text-paddy'
              }`}
            >
              <span
                className={`w-9 h-7 grid place-items-center rounded-lg transition ${
                  active ? 'bg-paddy/10' : ''
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              </span>
              {t(label)}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
