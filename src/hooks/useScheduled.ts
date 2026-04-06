import { useQuery } from '@tanstack/react-query'
import { fetchTimedTransactions } from '../api/sheets'

export function useScheduled() {
  return useQuery({
    queryKey: ['scheduled'],
    queryFn: fetchTimedTransactions,
    staleTime: 5 * 60_000,
  })
}
