'use client'

import { PrivateDataProof } from '@/app/offchain/private/ui/private-data-proof'
import { useFragments } from '../fragments-context'
import { AttestationCard } from '../ui/attestation-card'

export default function PrivateAttestationPage() {
  const { attestation, merkle } = useFragments()

  return (
    <AttestationCard attestation={attestation}>
      {merkle && (
        <PrivateDataProof
          privateData={merkle.values}
        />
      )}
    </AttestationCard>
  )
}
