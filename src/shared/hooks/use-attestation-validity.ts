import type { AttestationShareablePackageObject } from '@ethereum-attestation-service/eas-sdk'
import type { Address } from 'viem'
import { env } from '@/env'
import { EAS_CONTRACT_ABI } from '@/shared/config/EAS_CONTRACT_ABI'
import { useReadContract } from 'wagmi'

/**
 * Custom hook that checks if an attestation is valid by calling the isAttestationValid function on the EAS contract
 * @param uid The UID of the attestation to check
 * @returns Object containing isValid (boolean), isLoading (boolean), and error states
 */
export function useAttestationValidity(attestation: AttestationShareablePackageObject | null) {
  const { data: revokeTimestamp, isPending, error, queryKey } = useReadContract({
    address: env.NEXT_PUBLIC_EAS_CONTRACT as Address,
    abi: EAS_CONTRACT_ABI,
    functionName: 'getRevokeOffchain',
    args: [attestation?.signer as Address, attestation?.sig.uid as Address],
    query: {
      enabled: Boolean(attestation?.sig.uid),
    },
  })

  return {
    revoke: {
      timestamp: revokeTimestamp ? Number(revokeTimestamp) : 0,
      queryKey,
    },
    isPending,
    error,
  }
}
