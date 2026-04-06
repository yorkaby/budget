import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTransactions } from '../api/sheets'

const STALE_TIME = 60_000

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
    refetchIntervalInBackground: false,
  })
}

export function useRefreshAll() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries()
}
