import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'

export function useMyWarnings(enabled = true) {
  return useQuery({
    queryKey: ['my-warnings'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/warnings/mine')
        return data || []
      } catch {
        return []
      }
    },
    enabled,
    staleTime: 30_000,
  })
}

export function useBanStatus(enabled = true) {
  return useQuery({
    queryKey: ['ban-status'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/ban-status')
        return data
      } catch {
        return { is_banned: false, ban_type: 'none', total_warnings: 0 }
      }
    },
    enabled,
    staleTime: 10_000,
  })
}
