import { useQuery } from '@tanstack/react-query'
import { fetchParsedBudget } from '../api/budget'

export function useBudget() {
  return useQuery({
    queryKey: ['budget'],
    queryFn: fetchParsedBudget,
    staleTime: 5 * 60_000,
  })
}
