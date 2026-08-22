import { openDB } from 'idb'

const DB_NAME = 'cropcontract'
const DB_VERSION = 1

function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('outbox')) {
        database.createObjectStore('outbox', { keyPath: 'client_action_id' })
      }
      if (!database.objectStoreNames.contains('cache')) {
        database.createObjectStore('cache')
      }
    },
  })
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
}

/** Queue an offline action (create_commitment | disease_scan). */
export async function queueAction(type, payload) {
  const database = await db()
  const client_action_id = uuid()
  await database.put('outbox', { client_action_id, type, payload, queued_at: Date.now() })
  window.dispatchEvent(new Event('cc_outbox_changed'))
  return client_action_id
}

export async function getOutbox() {
  const database = await db()
  return database.getAll('outbox')
}

export async function removeAction(clientActionId) {
  const database = await db()
  await database.delete('outbox', clientActionId)
  window.dispatchEvent(new Event('cc_outbox_changed'))
}

export async function cacheSet(key, value) {
  const database = await db()
  await database.put('cache', value, key)
}

export async function cacheGet(key) {
  const database = await db()
  return database.get('cache', key)
}
