import api from './api.js'
import { getOutbox, removeAction } from './db.js'

let flushing = false
let intervalId = null

export function isOnline() {
  return navigator.onLine
}

/**
 * Flush the IndexedDB outbox to POST /sync.
 * Server resolves each action idempotently via client_action_id;
 * processed AND failed entries are removed either way (server gave a verdict).
 */
export async function flushOutbox() {
  if (!isOnline() || flushing) return { attempted: false }
  flushing = true
  try {
    const actions = await getOutbox()
    if (actions.length === 0) return { attempted: true, synced: 0 }

    const { data } = await api.post('/sync', {
      actions: actions.map(({ client_action_id, type, payload }) => ({
        client_action_id,
        type,
        payload,
      })),
    })

    const verdicts = [...data.processed, ...data.failed]
    for (const v of verdicts) {
      await removeAction(v.client_action_id)
    }
    return { attempted: true, synced: verdicts.length, detail: data }
  } catch (err) {
    // Network-level failure -> keep queue, retry later
    console.warn('[sync] flush failed:', err?.message)
    return { attempted: false, error: err }
  } finally {
    flushing = false
  }
}

/** Wire online/offline listeners + periodic retry. Call once at boot. */
export function initAutoSync() {
  window.addEventListener('online', () => flushOutbox())
  window.addEventListener('cc_auth_ready', () => flushOutbox())
  intervalId = setInterval(() => flushOutbox(), 30_000)
  flushOutbox()
  return () => clearInterval(intervalId)
}
