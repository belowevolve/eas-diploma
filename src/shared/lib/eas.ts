import type { AttestationShareablePackageObject } from '@ethereum-attestation-service/eas-sdk'
import type { QueryKey } from '@tanstack/react-query'
import { env } from '@/env'
import { EAS, Offchain, OffchainAttestationVersion } from '@ethereum-attestation-service/eas-sdk'

// Initialize the sdk with the address of the EAS Schema contract address
export const eas = new EAS(env.NEXT_PUBLIC_EAS_CONTRACT)

export type EASAttestation = AttestationShareablePackageObject & {
  revoke: {
    timestamp: number
    queryKey: QueryKey
  }
}

export function verifyOffchainAttestation(attestation: EASAttestation) {
  const offchain = new Offchain({
    address: attestation.sig.domain.verifyingContract,
    version: attestation.sig.domain.version,
    chainId: attestation.sig.domain.chainId,
  }, OffchainAttestationVersion.Version2, eas)

  return offchain.verifyOffchainAttestationSignature(
    attestation.signer,
    attestation.sig,
  )
}
