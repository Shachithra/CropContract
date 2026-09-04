import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import { cacheGet, cacheSet, queueAction } from '../lib/db.js'
import { isOnline } from '../lib/sync.js'

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
      return []
    },
  })
}

export function useMyCommitments(enabled = true) {
  return useQuery({
    queryKey: ['commitments'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/commitments/mine')
        try { await cacheSet('commitments', data || []) } catch { /* idb unavailable */ }
        return data || []
      } catch { /* offline / timeout */ }
      try {
        const cached = await cacheGet('commitments')
        if (cached) return cached
      } catch { /* idb unavailable */ }
      return []
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

export function useUpdateCommitmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ commitmentId, status }) => {
      const { data } = await api.patch(`/commitments/${commitmentId}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] })
    },
  })
}

export function useSubmitDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ commitmentId, delivered_qty_kg, quality_grade }) => {
      const { data } = await api.post(`/commitments/${commitmentId}/delivery`, {
        delivered_qty_kg,
        quality_grade,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] })
    },
  })
}
