'use client'

import type { MerkleMultiProof } from '@ethereum-attestation-service/eas-sdk'
import { useFragmentsDecoder } from '@/shared/hooks/use-fragments-decoder'
import { formatDate } from '@/shared/lib/utils'
import { AttestationQRCode } from '@/shared/ui/attestation-qr-code'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { Textarea } from '@/shared/ui/textarea'
import { PrivateData } from '@ethereum-attestation-service/eas-sdk'
import { useEffect, useState } from 'react'

export default function OffchainAttestationPage() {
  const { fragments, loading, error } = useFragmentsDecoder()

  const [showRawData, setShowRawData] = useState(false)
  const [proofInput, setProofInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean, message: string, proofData?: any[] } | null>(null)
  const attestation = fragments.attestation
  const proofs = fragments.proofs

  useEffect(() => {
    if (proofs) {
      setProofInput(JSON.stringify(proofs, null, 2))
      verifyProof(proofs)
    }
  }, [proofs])

  const download = () => {
    if (!attestation)
      return

    const dataStr = JSON.stringify(attestation, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `attestation-${attestation.sig.uid}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function verifyProof(proofs?: MerkleMultiProof) {
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
          ? 'Доказательство подтверждено! Лист найден в дереве Меркла.'
          : 'Недействительное доказательство. Лист не найден в дереве Меркла.',
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
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Text>Загрузка аттестации...</Text>
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Text variant="h3" className="text-red-500">Ошибка</Text>
          <Text>{error}</Text>
          <Button onClick={() => window.history.back()}>Вернуться назад</Button>
        </div>
      </PageContainer>
    )
  }

  if (!attestation) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Text variant="h3" className="text-red-500">Аттестация не найдена</Text>
          <Button onClick={() => window.history.back()}>Вернуться назад</Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Card className="max-w-4xl mx-auto my-8">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b">
          <div>
            <CardTitle className="flex items-center text-2xl">
              Offchain Attestation
              <span className="ml-4 px-3 py-1 bg-orange-500 text-white text-sm rounded-md">
                Private
              </span>
            </CardTitle>
          </div>
          <div className="mt-4 md:mt-0">
            <AttestationQRCode uid={attestation.sig.uid} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="border-b pb-4">
            <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">UID:</Text>
            <Text className="font-mono break-all">{attestation.sig.uid}</Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-4">СХЕМА:</Text>
              <div className="flex items-center bg-blue-100 p-3 rounded-md">
                <div className="bg-blue-300 text-blue-800 font-bold rounded px-3 py-1 mr-3">
                  #43
                </div>
                <div>
                  <Text className="font-medium">ПРИВАТНЫЕ ДАННЫЕ</Text>
                  <Text className="text-sm font-mono text-gray-600">
                    {attestation.sig.message.schema.substring(0, 10)}
                    ...
                    {attestation.sig.message.schema.substring(attestation.sig.message.schema.length - 8)}
                  </Text>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">ВРЕМЕННЫЕ МЕТКИ:</Text>
                <Text className="font-medium">
                  Создано:
                  {' '}
                  {formatDate(new Date(Number(attestation.sig.message.time) * 1000))}
                </Text>
                <Text className="text-sm text-blue-600 hover:underline cursor-pointer">
                  Временная метка в блокчейне
                </Text>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">СРОК ДЕЙСТВИЯ:</Text>
                  <Text className="font-medium">
                    {attestation.sig.message.expirationTime > 0
                      ? formatDate(new Date(attestation.sig.message.expirationTime * 1000))
                      : 'Бессрочно'}
                  </Text>
                </div>
                <div>
                  <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">ОТОЗВАНО:</Text>
                  <Text className="font-medium">Нет</Text>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">ОТ:</Text>
              <Text className="font-mono break-all">{attestation.signer}</Text>
            </div>
            <div>
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">КОМУ:</Text>
              <Text className="font-medium">
                {attestation.sig.message.recipient === '0x0000000000000000000000000000000000000000'
                  ? 'Нет получателя'
                  : attestation.sig.message.recipient}
              </Text>
            </div>
          </div>

          <div>
            <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-4">ДЕКОДИРОВАННЫЕ ДАННЫЕ:</Text>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex mb-2">
                <div className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded">
                  BYTES32
                </div>
                <div className="ml-2 bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded">
                  Приватные данные
                </div>
              </div>
              <Text className="font-mono text-sm break-all">
                {attestation.sig.message.data}
              </Text>
            </div>
          </div>

          <div>
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
          </div>

          <div>
            <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-2">СВЯЗАННАЯ АТТЕСТАЦИЯ:</Text>
            <Text>Нет ссылок</Text>
          </div>

          <div>
            <Text
              className="text-blue-600 hover:underline cursor-pointer"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? 'Скрыть исходные данные' : 'Показать исходные данные'}
            </Text>

            {showRawData && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(attestation, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-4 mt-6">

          <Button onClick={download}>
            Скачать
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  )
}
