import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useOfflineSync } from '../../hooks/useOfflineSync.js'
import OverCommitRecovery from '../../components/farmer/OverCommitRecovery.jsx'
import Toast from '../../components/common/Toast.jsx'
import TopBar from '../layout/TopBar.jsx'
import NavTabs from '../layout/NavTabs.jsx'
import OfflineBanner from '../layout/OfflineBanner.jsx'
import { Outlet } from 'react-router-dom'

export default function AppShell() {
  const [overCommitError, setOverCommitError] = useState(null)
  const queryClient = useQueryClient()

  const handleOverCommitted = useCallback((error) => {
    setOverCommitError(error)
  }, [])

  const { online, syncing, pending } = useOfflineSync({ onOverCommitted: handleOverCommitted })

  const handleReduce = useCallback(() => {
    // TODO: pre-fill a commit form with the remaining quantity
    setOverCommitError(null)
  }, [])

  const handleViewSimilar = useCallback(() => {
    setOverCommitError(null)
    // Navigate to marketplace filtered by region/crop
    window.location.href = '/marketplace'
  }, [])

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar syncState={{ online, syncing, pending }} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-28 pt-4">
        <Outlet />
      </main>
      <NavTabs />
      <OfflineBanner />
      <Toast />
      <OverCommitRecovery
        error={overCommitError}
        onReduce={handleReduce}
        onViewSimilar={handleViewSimilar}
      />
    </div>
  )
}
