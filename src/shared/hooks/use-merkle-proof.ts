import type { MerkleMultiProof, MerkleValue } from '@ethereum-attestation-service/eas-sdk'
import { PrivateData } from '@ethereum-attestation-service/eas-sdk'
import { useState } from 'react'

interface UseMerkleProofResult {
  generateProof: (selectedFields: number[]) => MerkleMultiProof
  proofResult: MerkleMultiProof | null
}

export function useMerkleProof(merkle: MerkleValue[]): UseMerkleProofResult {
  const [proofResult, setProofResult] = useState<MerkleMultiProof | null>(null)

  const generateProof = (selectedFields: number[]): MerkleMultiProof => {
    const privateData = new PrivateData(merkle)
    const multiProof = privateData.generateMultiProof(selectedFields)
    setProofResult(multiProof)
    return multiProof
  }

  return {
    generateProof,
    proofResult,
  }
}
