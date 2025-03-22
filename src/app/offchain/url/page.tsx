'use client'

import type { MerkleMultiProof } from '@ethereum-attestation-service/eas-sdk'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Text } from '@/shared/ui/text'
import { Textarea } from '@/shared/ui/textarea'
import { PrivateData } from '@ethereum-attestation-service/eas-sdk'
import { useCallback, useEffect, useState } from 'react'
import { useFragments } from '../fragments-context'
import { AttestationCard } from '../ui/attestation-card'

export default function OffchainAttestationPage() {
  const { attestation, proofs } = useFragments()

  const [proofInput, setProofInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean, message: string, proofData?: any[] } | null>(null)

  const verifyProof = useCallback((proofs?: MerkleMultiProof) => {
    if (!attestation || (!proofs && !proofInput.trim())) {
      setVerificationResult({
        isValid: false,
        message: 'Пожалуйста, введите корректный пруф для проверки',
      })
      return
    }

    try {
      // Parse the proof input
      const parsedProof = proofInput ? JSON.parse(proofInput) : proofs
      console.log('parsedProof', parsedProof, proofInput, proofs)

      // Get the merkle root from the attestation data
      const merkleRoot = attestation.sig.message.data

      // Verify the proof
      const isValid = PrivateData.verifyMultiProof(merkleRoot, parsedProof as MerkleMultiProof)
      console.log('merkleRoot', merkleRoot, parsedProof.leaves, isValid)

      setVerificationResult({
        isValid,
        message: isValid
          ? 'Доказательство подтверждено! Данные в дереве Меркла.'
          : 'Недействительное доказательство!',
        proofData: isValid ? parsedProof.leaves : undefined,
      })
    }
    catch (err) {
      console.error('Error verifying proof:', err)
      setVerificationResult({
        isValid: false,
        message: `Ошибка проверки доказательства: ${(err as Error).message || 'Неверный формат доказательства'}`,
      })
    }
  }, [attestation, proofInput])

  useEffect(() => {
    if (proofs) {
      setProofInput(JSON.stringify(proofs, null, 2))
      verifyProof(proofs)
    }
  }, [proofs, verifyProof])

  return (
    <>
      <AttestationCard attestation={attestation} />
      <Card className="max-w-4xl mx-auto my-8">
        <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-2">ПРОВЕРКА доказательства</Text>
        <Text className="text-sm text-gray-600 mb-2">
          Импортируйте доказательство или вставьте его ниже для проверки корня Меркла.
        </Text>
        <Textarea
          className="min-h-32 font-mono text-sm"
          placeholder="Вставьте доказательство здесь (формат JSON)"
          value={proofInput}
          onChange={e => setProofInput(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <Button variant="outline" className="ml-auto" onClick={() => verifyProof()}>
            Проверить доказательство
          </Button>
        </div>

        {verificationResult && (
          <div className={`mt-4 p-4 rounded-md ${verificationResult.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex items-center">
              {verificationResult.isValid
                ? (
                    <div className="flex items-center text-green-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <Text className="font-medium">{verificationResult.message}</Text>
                    </div>
                  )
                : (
                    <div className="flex items-center text-red-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <Text className="font-medium">{verificationResult.message}</Text>
                    </div>
                  )}
            </div>

            {verificationResult.isValid && verificationResult.proofData && (
              <div className="mt-4">
                <Text className="font-medium text-green-700 mb-2">Расшифрованные данные из доказательства:</Text>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <table className="w-full">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="p-2 text-left text-green-800">Имя</th>
                        <th className="p-2 text-left text-green-800">Значение</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationResult.proofData.map((item, index) => (
                        <tr key={index} className="border-t border-green-100">
                          <td className="p-2 font-medium">{item.name || `Поле ${index + 1}`}</td>
                          <td className="p-2">{item.value?.toString() || 'Н/Д'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </Card>
    </>
  )
}
