import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'
import { isOnline } from '../lib/sync.js'
import { cacheGet, cacheSet, queueAction } from '../lib/db.js'
import { MOCK_CONTRACTS, MOCK_COMMITMENTS } from '../lib/mockData.js'

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/contracts')
        if (data?.length > 0) {
          try { await cacheSet('contracts', data) } catch { /* idb unavailable */ }
          return data
        }
      } catch { /* offline / timeout */ }
      try {
        const cached = await cacheGet('contracts')
        if (cached?.length > 0) return cached
      } catch { /* idb unavailable */ }
      return MOCK_CONTRACTS
    },
  })
}

export function useMyCommitments(enabled = true) {
  return useQuery({
    queryKey: ['commitments'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/commitments/mine')
        if (data?.length > 0) {
          try { await cacheSet('commitments', data) } catch { /* idb unavailable */ }
          return data
        }
      } catch { /* offline / timeout */ }
      try {
        const cached = await cacheGet('commitments')
        if (cached?.length > 0) return cached
      } catch { /* idb unavailable */ }
      return MOCK_COMMITMENTS
    },
    enabled,
  })
}

/**
 * Commit to a contract — works offline.
 * Online -> POST /contracts/{id}/commit immediately.
 * Offline -> queued in IndexedDB and replayed via POST /sync later.
 */
export async function commitToContract(contractId, quantityKg) {
  if (isOnline()) {
    const { data } = await api.post(`/contracts/${contractId}/commit`, {
      quantity_kg: quantityKg,
    })
    return { synced: true, commitment: data }
  }
  const actionId = await queueAction('create_commitment', {
    contract_id: contractId,
    quantity_kg: quantityKg,
  })
  return { synced: false, actionId }
}
