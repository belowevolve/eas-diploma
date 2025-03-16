'use client'

import { formatDate } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { decodeBase64ZippedBase64 } from '@ethereum-attestation-service/eas-sdk'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// Updated interface to handle bigint chainId
interface AttestationData {
  sig: {
    domain: {
      name: string
      version: string
      chainId: bigint | number
      verifyingContract: string
    }
    primaryType: string
    types: Record<string, any>
    message: {
      schema: string
      recipient: string
      time: number
      expirationTime: number
      revocable: boolean
      refUID: string
      data: string
      nonce: number
    }
    uid: string
    signature: string
  }
  signer: string
}

export default function OffchainAttestationPage() {
  const [attestation, setAttestation] = useState<AttestationData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    const decodeAttestationFromUrl = async () => {
      try {
        setLoading(true)

        // Get the URL fragment
        const fragment = window.location.hash
        if (!fragment || !fragment.includes('attestation=')) {
          throw new Error('Аттестация не найдена в URL')
        }
        console.log(fragment)
        const attestationParam = decodeURIComponent(fragment.split('attestation=')[1])
        console.log(attestationParam)
        // Extract the attestation data from the fragment
        const attestation = decodeBase64ZippedBase64(attestationParam)
        console.log('attestation', attestation)
        if (!attestation) {
          throw new Error('Некорректный формат аттестации')
        }

        try {
          // Type assertion to handle the bigint chainId
          setAttestation(attestation as unknown as AttestationData)

          // Generate QR code for the attestation URL
          const qrCode = await QRCode.toDataURL(window.location.href, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 200,
          })
          setQrCodeUrl(qrCode)
          setLoading(false)
        }
        catch (parseError) {
          console.error('Error parsing attestation data:', parseError)
          throw new Error('Некорректный формат данных аттестации')
        }
      }
      catch (err) {
        console.error('Error decoding attestation:', err)
        setError((err as Error).message || 'Произошла ошибка при загрузке аттестации')
        setLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      decodeAttestationFromUrl()
    }
  }, [])

  const downloadQRCode = () => {
    if (!qrCodeUrl)
      return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `attestation-${attestation?.sig?.uid || 'unknown'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success('Ссылка скопирована в буфер обмена')
      })
      .catch(err => console.error('Не удалось скопировать ссылку:', err))
  }

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
            <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
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
                  <Text className="font-medium">No</Text>
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

          <div>
            <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-2">VERIFY PROOF</Text>
            <Text className="text-sm text-gray-600 mb-2">
              Import a proof or paste it below to verify it against the merkle root.
            </Text>
            <div className="bg-gray-50 rounded-md p-4 h-32">
              <Text className="text-gray-400">Paste proof here</Text>
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="outline" className="ml-auto">
                Verify Proof
              </Button>
            </div>
          </div>

          <div>
            <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-2">REFERENCED ATTESTATION:</Text>
            <Text>No reference</Text>
          </div>

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
          <Button variant="outline" onClick={downloadQRCode}>
            Download QR
          </Button>
          <Button variant="outline" onClick={copyLink}>
            Copy Link
          </Button>
          <Button onClick={download}>
            Download
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  )
}
