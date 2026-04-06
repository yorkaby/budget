import { useQuery } from '@tanstack/react-query'
import { fetchEurRate } from '../api/exchangeRate'

export function useEurRate() {
  return useQuery({
    queryKey: ['eurRate'],
    queryFn: fetchEurRate,
    staleTime: 30 * 60_000,   // BOI updates once a day; re-fetch every 30 min
    retry: 2,
  })
}
