import { useCallback, useEffect, useState } from 'react'
import { flushOutbox, isOnline } from '../lib/sync.js'
import { getOutbox, removeAction } from '../lib/db.js'

/**
 * Tracks connectivity + outbox depth; auto-flushes the queue when the
 * connection returns. Also handles OVER_COMMITTED recovery.
 */
export function useOfflineSync({ onOverCommitted } = {}) {
  const [online, setOnline] = useState(isOnline())
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshPending = useCallback(async () => {
    try {
      const actions = await getOutbox()
      setPending(actions.length)
    } catch {
      /* IndexedDB unavailable */
    }
  }, [])

  const processSyncResult = useCallback(async (result) => {
    if (!result?.detail) return
    const allResults = [...(result.detail.processed || []), ...(result.detail.failed || [])]
    for (const r of allResults) {
      if (r.error && r.error.startsWith('OVER_COMMITTED:')) {
        // Find the original queued action to get contract details
        const actions = await getOutbox()
        // Action was already removed, so we construct from the error
        const parts = r.error.split(':')
        const detail = parts.slice(1).join(':')
        const remainingMatch = detail.match(/Only (\d+)kg/)
        const remaining = remainingMatch ? parseFloat(remainingMatch[1]) : 0
        onOverCommitted?.({
          detail,
          remaining_kg: remaining,
          client_action_id: r.client_action_id,
        })
      }
    }
  }, [onOverCommitted])

  const doFlush = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await flushOutbox()
      if (result?.detail) {
        await processSyncResult(result)
      }
    } finally {
      setSyncing(false)
      refreshPending()
    }
  }, [processSyncResult, refreshPending])

  useEffect(() => {
    refreshPending()

    const goOnline = async () => {
      setOnline(true)
      await doFlush()
    }
    const goOffline = () => setOnline(false)
    const onQueueChanged = () => refreshPending()
    const onManualFlush = () => doFlush()

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
  }, [refreshPending, doFlush])

  return { online, pending, syncing }
}
