'use client'

import { PrivateDataProof } from '@/app/offchain/private/ui/private-data-proof'
import { useFragmentsDecoder } from '@/shared/hooks/use-fragments-decoder'
import { useMerkleProof } from '@/shared/hooks/use-merkle-proof'
import { formatDate } from '@/shared/lib/utils'
import { AttestationQRCode } from '@/shared/ui/attestation-qr-code'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { useState } from 'react'

export default function PrivateAttestationPage() {
  const { fragments, loading, error } = useFragmentsDecoder()
  const attestation = fragments.attestation
  const merkle = fragments.merkle
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
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-4">SCHEMA:</Text>
              <div className="flex items-center bg-blue-100 p-3 rounded-md">
                <div className="bg-blue-300 text-blue-800 font-bold rounded px-3 py-1 mr-3">
                  #43
                </div>
                <div>
                  <Text className="font-medium">PRIVATE DATA</Text>
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
                <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">TIMESTAMPS:</Text>
                <Text className="font-medium">
                  Created:
                  {' '}
                  {formatDate(new Date(Number(attestation.sig.message.time) * 1000))}
                </Text>
                <Text className="text-sm text-blue-600 hover:underline cursor-pointer">
                  Timestamp onchain
                </Text>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">EXPIRATION:</Text>
                  <Text className="font-medium">
                    {attestation.sig.message.expirationTime > 0
                      ? formatDate(new Date(attestation.sig.message.expirationTime * 1000))
                      : 'Never'}
                  </Text>
                </div>
                <div>
                  <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">REVOKED:</Text>
                  <Text className="font-medium">
                    No
                    {' '}
                    <span className="text-blue-600 hover:underline">[Revoke now]</span>
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">FROM:</Text>
              <Text className="font-mono break-all">{attestation.signer}</Text>
            </div>
            <div>
              <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-1">TO:</Text>
              <Text className="font-medium">
                {attestation.sig.message.recipient === '0x0000000000000000000000000000000000000000'
                  ? 'No recipient'
                  : attestation.sig.message.recipient}
              </Text>
            </div>
          </div>

          <div>
            <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-4">DECODED DATA:</Text>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex mb-2">
                <div className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded">
                  BYTES32
                </div>
                <div className="ml-2 bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded">
                  Private Data
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
              {showRawData ? 'Hide raw data' : 'Show raw data'}
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
            Download
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  )
}
