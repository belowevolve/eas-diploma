import type { AttestationShareablePackageObject } from '@ethereum-attestation-service/eas-sdk'
import { eas } from '@/shared/lib/eas'
import { skipToken, useQuery } from '@tanstack/react-query'
import { useProvider } from './use-provider'

export const QK_ATT_VALIDITY = (uid?: string, signer?: string) => ['attestation-validity', uid, signer]
export function useAttestationValidity(attestation: AttestationShareablePackageObject | null) {
  const provider = useProvider()
  const queryKey = QK_ATT_VALIDITY(attestation?.sig.uid, attestation?.signer)
  const { data: revokeTimestamp, isPending, error } = useQuery({
    queryKey,
    queryFn: provider && attestation
      ? async () => {
        eas.connect(provider)
        const revokeTimestamp = await eas.getRevocationOffchain(attestation.signer, attestation.sig.uid)
        return revokeTimestamp
      }
      : skipToken,
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
