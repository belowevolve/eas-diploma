'use client'

import type { EASAttestation } from '@/shared/lib/eas'
import type { MerkleMultiProof } from '@ethereum-attestation-service/eas-sdk'
import { renderMerkleValue } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { CardDescription } from '@/shared/ui/card'
import { Text } from '@/shared/ui/text'
import { Textarea } from '@/shared/ui/textarea'
import { PrivateData } from '@ethereum-attestation-service/eas-sdk'
import { CheckIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { sha256 } from 'viem'
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
  const { attestation, proofs, refAttestation } = useFragments()

  const [proofInput, setProofInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerifyResult | null>(null)
  const [fileVerification, setFileVerification] = useState<{ fileName: string, fileHash: string, isValid: boolean, message: string } | null>(null)

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
    <>
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
                          <td className="p-2">
                            {renderMerkleValue(item)}
                          </td>
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
      {refAttestation && (
        <AttestationCard attestation={refAttestation as EASAttestation}>
          <div>
            <CardDescription>Проверка файла:</CardDescription>
            <div
              className="mt-4 p-4 border-2 border-dashed border-muted rounded-lg text-center hover:border-primary transition-colors"
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.classList.add('border-primary')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.classList.remove('border-primary')
              }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.classList.remove('border-primary')

                const file = e.dataTransfer.files[0]
                if (!file)
                  return

                // Read file as array buffer
                const buffer = await file.arrayBuffer()
                // Convert to Uint8Array for hashing
                const data = new Uint8Array(buffer)

                const fileHash = sha256(data)
                // Compare with attestation hash
                const attestationHash = refAttestation?.sig.message.data
                const isValid = attestationHash === fileHash

                setFileVerification({
                  fileName: file.name,
                  fileHash,
                  isValid,
                  message: isValid ? 'Хеш файла совпадает!' : 'Хеш файла не совпадает с аттестацией',
                })
              }}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file)
                    return
                  const buffer = await file.arrayBuffer()
                  const data = new Uint8Array(buffer)
                  const fileHash = sha256(data)
                  const attestationHash = refAttestation?.sig.message.data
                  const isValid = attestationHash === fileHash

                  setFileVerification({
                    fileName: file.name,
                    fileHash,
                    isValid,
                    message: isValid ? 'Хеш файла совпадает!' : 'Хеш файла не совпадает с аттестацией',
                  })
                }}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="rounded-full p-2 bg-muted">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  Нажмите для загрузки файла или перетащите его сюда
                </span>
                <span className="text-xs text-muted-foreground">
                  Файл будет обработан локально
                </span>
              </label>
            </div>

            {fileVerification && (
              <div className={`mt-4 p-4 rounded-md ${fileVerification.isValid ? 'bg-success' : 'bg-destructive'}`}>
                <div className={`flex items-center ${fileVerification.isValid ? 'text-success-foreground' : 'text-destructive-foreground'}`}>
                  {fileVerification.isValid
                    ? <CheckIcon className="mr-2 shrink-0" />
                    : <XIcon className="mr-2 shrink-0" />}
                  <div>
                    <Text className="font-medium text-current">{fileVerification.message}</Text>
                    <Text className="text-sm opacity-90">
                      Файл:
                      {' '}
                      {fileVerification.fileName}
                    </Text>
                    <Text className="text-sm font-mono opacity-90">
                      Хеш:
                      {' '}
                      {fileVerification.fileHash}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AttestationCard>
      )}
    </>
  )
}
