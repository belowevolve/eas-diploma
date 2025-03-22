'use client'

import { PrivateDataProof } from '@/app/offchain/private/ui/private-data-proof'
import { useMerkleProof } from '@/shared/hooks/use-merkle-proof'
import { useFragments } from '../fragments-context'
import { AttestationCard } from '../ui/attestation-card'

export default function PrivateAttestationPage() {
  const { attestation, merkle } = useFragments()
  const { generateProof, proofResult } = useMerkleProof(merkle?.values)
  return (
    <AttestationCard attestation={attestation}>
      <PrivateDataProof
        privateData={merkle?.values}
        onGenerateProof={generateProof}
        proofResult={proofResult}
      />
    </AttestationCard>
  )
}
