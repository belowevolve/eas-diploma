'use client'

import { PrivateDataProof } from '@/app/offchain/private/ui/private-data-proof'
import { useMerkleProof } from '@/shared/hooks/use-merkle-proof'
import { formatDate } from '@/shared/lib/utils'
import { AttestationQRCode } from '@/shared/ui/attestation-qr-code'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { useState } from 'react'
import { useFragments } from '../fragments-context'

export default function PrivateAttestationPage() {
  const { attestation, merkle } = useFragments()
  const [showRawData, setShowRawData] = useState(false)

  const { generateProof, proofResult } = useMerkleProof(merkle?.values)

  const download = () => {
    if (!attestation) {
      return
    }

    const dataStr = JSON.stringify(attestation, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2)
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

  return (
    <PageContainer>
      <Card className="max-w-4xl mx-auto my-8">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b">
          <div>
            <CardTitle className="flex items-center text-2xl">
              Оффчейн аттестация
              <span className="ml-4 px-3 py-1 bg-orange-500 text-white text-sm rounded-md">
                Приватная страница
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
                  #1
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
                  <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">Дата экспирации:</Text>
                  <Text className="font-medium">
                    {attestation.sig.message.expirationTime > 0
                      ? formatDate(new Date(Number(attestation.sig.message.expirationTime) * 1000))
                      : 'Never'}
                  </Text>
                </div>
                <div>
                  <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">ОТОЗВАНО:</Text>
                  <Text className="font-medium">
                    Нет
                    {' '}
                    <span className="text-blue-600 hover:underline">[Отозвать]</span>
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">От:</Text>
              <Text className="font-mono break-all">{attestation.signer}</Text>
            </div>
            <div>
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">Кому:</Text>
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

          <PrivateDataProof
            privateData={merkle?.values}
            onGenerateProof={generateProof}
            proofResult={proofResult}
          />

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
