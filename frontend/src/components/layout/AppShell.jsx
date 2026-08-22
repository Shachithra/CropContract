import { Outlet } from 'react-router-dom'
import TopBar from './TopBar.jsx'
import NavTabs from './NavTabs.jsx'
import OfflineBanner from './OfflineBanner.jsx'

export default function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-28 pt-4">
        <Outlet />
      </main>
      <NavTabs />
      <OfflineBanner />
    </div>
  )
}
