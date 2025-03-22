'use client'

import { PrivateDataProof } from '@/app/offchain/private/ui/private-data-proof'
import { useMerkleProof } from '@/shared/hooks/use-merkle-proof'
import { formatDate } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { useState } from 'react'
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
