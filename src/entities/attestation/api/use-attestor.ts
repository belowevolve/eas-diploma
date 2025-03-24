import { useQuery } from '@tanstack/react-query'
import { getAttestor } from './server/get-attestor'

export function useAttestor(address: string) {
  const { data: attestor, isPending } = useQuery({
    queryKey: ['attestor', address],
    queryFn: () => getAttestor(address),
  })

  return {
    attestor,
    isPending,
  }
}
