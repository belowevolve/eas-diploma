'use client'

import type { EASAttestation } from '@/shared/lib/eas'
import type { MerkleMultiProof } from '@ethereum-attestation-service/eas-sdk'
import { Button } from '@/shared/ui/button'
import { CardDescription } from '@/shared/ui/card'
import { Text } from '@/shared/ui/text'
import { Textarea } from '@/shared/ui/textarea'
import { PrivateData } from '@ethereum-attestation-service/eas-sdk'
import { CheckIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFragments } from '../fragments-context'
import { AttestationCard } from '../ui/attestation-card'

interface VerifyResult { isValid: boolean, message: string, proofData?: any[] }

function verifyProof(attestation: EASAttestation, proofInput: string): VerifyResult {
  if (!proofInput.trim()) {
    return {
      isValid: false,
      message: 'Пожалуйста, введите корректный пруф для проверки',
    }
  }
  try {
    const parsedProof = JSON.parse(proofInput)
    const merkleRoot = attestation.sig.message.data
    const isValid = PrivateData.verifyMultiProof(merkleRoot, parsedProof as MerkleMultiProof)
    return {
      isValid,
      message: isValid
        ? 'Доказательство подтверждено!'
        : 'Недействительное доказательство!',
      proofData: isValid ? parsedProof.leaves : undefined,
    }
  }
  catch (err) {
    console.error('Error verifying proof:', err)
    return {
      isValid: false,
      message: `Ошибка проверки доказательства: 'Неверный формат доказательства'`,
    }
  }
}

export default function OffchainAttestationPage() {
  const { attestation, proofs } = useFragments()

  const [proofInput, setProofInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerifyResult | null>(null)

  function handleVerifyProof() {
    setVerificationResult(verifyProof(attestation, proofInput))
  }

  useEffect(() => {
    if (proofs) {
      const proofInput = JSON.stringify(proofs, null, 2)
      setProofInput(proofInput)
      setVerificationResult(verifyProof(attestation, proofInput))
    }
  }, [proofs, attestation])

  return (
    <AttestationCard attestation={attestation}>
      <div>
        <CardDescription>Проверка доказательства:</CardDescription>
        <Textarea
          className="min-h-32 font-mono text-sm"
          placeholder="Импортируйте доказательство или вставьте его ниже для проверки корня Меркла. (формат JSON)"
          value={proofInput}
          onChange={e => setProofInput(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" className="ml-auto" onClick={handleVerifyProof}>
          Проверить доказательство
        </Button>
      </div>

      {verificationResult && (
        <div className={`mt-2 p-4 rounded-md ${verificationResult.isValid ? 'bg-success' : 'bg-destructive'}`}>
          <div className={`flex items-center ${verificationResult.isValid ? 'text-success-foreground' : 'text-destructive-foreground'}`}>
            {verificationResult.isValid
              ? <CheckIcon className="mr-2 shrink-0" />
              : <XIcon className=" mr-2 shrink-0" />}
            <Text className="font-medium text-current text-balance">{verificationResult.message}</Text>
          </div>

          {verificationResult.isValid && verificationResult.proofData && (
            <div className="mt-4">
              <Text className="font-medium text-success-foreground mb-2">Расшифрованные данные из доказательства:</Text>
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
    </AttestationCard>
  )
}
