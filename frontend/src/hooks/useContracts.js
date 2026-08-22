import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'
import { isOnline } from '../lib/sync.js'
import { cacheGet, cacheSet, queueAction } from '../lib/db.js'

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/contracts')
        await cacheSet('contracts', data)
        return data
      } catch (err) {
        if (!isOnline()) {
          const cached = await cacheGet('contracts')
          if (cached) return cached
        }
        throw err
      }
    },
  })
}

export function useMyCommitments(enabled = true) {
  return useQuery({
    queryKey: ['commitments'],
    queryFn: async () => {
      const { data } = await api.get('/commitments/mine')
      await cacheSet('commitments', data)
      return data
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
