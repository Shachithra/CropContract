import { useCallback, useEffect, useState } from 'react'
import { flushOutbox, isOnline } from '../lib/sync.js'
import { getOutbox } from '../lib/db.js'

/**
 * Tracks connectivity + outbox depth; auto-flushes the queue when the
 * connection returns. Also listens for manual flush requests.
 */
export function useOfflineSync() {
  const [online, setOnline] = useState(isOnline())
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshPending = useCallback(async () => {
    try {
      const actions = await getOutbox()
      setPending(actions.length)
    } catch {
      /* IndexedDB unavailable - ignore */
    }
  }, [])

  useEffect(() => {
    refreshPending()

    const goOnline = async () => {
      setOnline(true)
      setSyncing(true)
      await flushOutbox()
      setSyncing(false)
      refreshPending()
    }
    const goOffline = () => setOnline(false)
    const onQueueChanged = () => refreshPending()
    const onManualFlush = async () => {
      setSyncing(true)
      await flushOutbox()
      setSyncing(false)
      refreshPending()
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('cc_outbox_changed', onQueueChanged)
    window.addEventListener('cc_flush_now', onManualFlush)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('cc_outbox_changed', onQueueChanged)
      window.removeEventListener('cc_flush_now', onManualFlush)
    }
  }, [refreshPending])

  return { online, pending, syncing }
}
