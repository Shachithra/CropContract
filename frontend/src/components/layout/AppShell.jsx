import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useOfflineSync } from '../../hooks/useOfflineSync.js'
import OverCommitRecovery from '../../components/farmer/OverCommitRecovery.jsx'
import Toast from '../../components/common/Toast.jsx'
import InstallPrompt from '../../components/common/InstallPrompt.jsx'
import TopBar from '../layout/TopBar.jsx'
import DesktopSidebar from '../layout/DesktopSidebar.jsx'
import NavTabs from '../layout/NavTabs.jsx'
import OfflineBanner from '../layout/OfflineBanner.jsx'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function AppShell() {
  const [overCommitError, setOverCommitError] = useState(null)
  const queryClient = useQueryClient()
  const location = useLocation()

  const handleOverCommitted = useCallback((error) => {
    setOverCommitError(error)
  }, [])

  const { online, syncing, pending } = useOfflineSync({ onOverCommitted: handleOverCommitted })

  const handleReduce = useCallback(() => {
    setOverCommitError(null)
  }, [])

  const handleViewSimilar = useCallback(() => {
    setOverCommitError(null)
    window.location.href = '/marketplace'
  }, [])

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <TopBar syncState={{ online, syncing, pending }} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-28 md:pb-8 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <NavTabs className="md:hidden" />
      </div>
      <OfflineBanner />
      <InstallPrompt />
      <Toast />
      <OverCommitRecovery
        error={overCommitError}
        onReduce={handleReduce}
        onViewSimilar={handleViewSimilar}
      />
    </div>
  )
}
