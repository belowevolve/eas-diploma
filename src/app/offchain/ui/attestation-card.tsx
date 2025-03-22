'use client'

import type { EASAttestation } from '@/shared/lib/eas'
import { cn } from '@/shared/lib/cn'
import { verifyOffchainAttestation } from '@/shared/lib/eas'
import { formatDate } from '@/shared/lib/utils'
import { AttestationQRCode } from '@/shared/ui/attestation-qr-code'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Text } from '@/shared/ui/text'
import { useState } from 'react'
import { Revoke } from './revoke'

export function AttestationCard({ attestation }: { attestation: EASAttestation }) {
  const isValidAttestation = verifyOffchainAttestation(attestation)
  const [showRawData, setShowRawData] = useState(false)

  const download = () => {
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

  return (
    <Card className="max-w-4xl mx-auto">

      <CardHeader className="border-b max-md:flex max-md:flex-col ">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="flex items-center text-2xl">
            Оффчейн аттестация
            <span className={cn('ml-4 px-3 py-1 text-white text-sm rounded-md', isValidAttestation && attestation.revokeTimestamp === 0 ? 'bg-green-500' : 'bg-red-500')}>
              {isValidAttestation && attestation.revokeTimestamp === 0 ? 'Действительная' : 'Недействительная'}
            </span>
          </CardTitle>
          <div>
            <CardDescription>UID:</CardDescription>
            <Text className="font-mono font-bold text-sm break-all">{attestation.sig.uid}</Text>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <CardDescription>Срок действия:</CardDescription>
              <Text className="font-medium text-sm">
                {attestation.sig.message.expirationTime > 0
                  ? formatDate(new Date(Number(attestation.sig.message.expirationTime) * 1000))
                  : 'Бессрочно'}
              </Text>
            </div>
            <div>
              <CardDescription>Дата выдачи:</CardDescription>
              <Text className="font-medium text-sm">
                {formatDate(new Date(Number(attestation.sig.message.time) * 1000))}
              </Text>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            <CardDescription>Аттестация отозвана:</CardDescription>
            <Text className="font-medium text-sm flex items-center gap-2">
              {attestation.revokeTimestamp === 0 
                ? 
                    <>
                      Нет
                      <Revoke attestation={attestation} />
                    </>
                  
                : 
                    <span className='text-destructive'>
                      {formatDate(new Date(Number(attestation.revokeTimestamp) * 1000))}
                    </span>
                  }
            </Text>
          </div>
        </div>
        <CardAction className="mx-auto">
          <AttestationQRCode uid={attestation.sig.uid} />
        </CardAction>
      </CardHeader>

      <CardContent>

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
  )
}
