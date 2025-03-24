'use client'

import type { EASAttestation } from '@/shared/lib/eas'
import { useAttestor } from '@/entities/attestation/api/use-attestor'
import { verifyOffchainAttestation } from '@/shared/lib/eas'
import { formatDate } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Text } from '@/shared/ui/text'
import { shortAddress } from '@/shared/utils/address'
import Link from 'next/link'
import { zeroAddress } from 'viem'
import { AttestationQRCode } from './attestation-qr-code'
import { AttestationRawData } from './attestation-raw-data'
import { Revoke } from './revoke'

export function AttestationCard({ attestation, children }: { attestation: EASAttestation, children?: React.ReactNode }) {
  const isValidAttestation = verifyOffchainAttestation(attestation)
  const revokeTimestamp = attestation.revoke.timestamp
  const isRevoked = revokeTimestamp !== 0
  const { attestor } = useAttestor(attestation.signer)
  return (
    <Card className="max-w-screen-xl mx-auto flex-row flex-wrap gap-y-6">
      <div className="flex flex-col gap-6 grow">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2">
              Оффчейн аттестация
              <Badge variant={isValidAttestation && !isRevoked ? 'success' : 'destructive'}>
                {isValidAttestation && !isRevoked ? 'Действительная' : 'Недействительная'}
              </Badge>
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
            <div className="flex items-center gap-1">
              <CardDescription>Аттестация отозвана:</CardDescription>
              <Text className="font-medium text-sm flex items-center gap-2">
                {isRevoked
                  ? (
                      <span className="text-destructive-foreground">
                        {formatDate(new Date(Number(revokeTimestamp) * 1000))}
                      </span>
                    )

                  : (
                      <>
                        Нет
                        <Revoke attestation={attestation} />
                      </>
                    )}
              </Text>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <div>
            <CardDescription>Схема:</CardDescription>
            <div className="flex items-center bg-blue-100 p-3 rounded-md">
              <div className="bg-blue-300 text-blue-800 font-bold rounded px-3 py-1 mr-3">
                #1
              </div>
              <div>
                <Text className="font-medium">ПРИВАТНЫЕ ДАННЫЕ</Text>
                <Text className="font-mono text-muted-foreground text-sm break-all">
                  {shortAddress(attestation.sig.message.schema)}
                </Text>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 ">
            <div>
              <CardDescription>От:</CardDescription>
              <Text className="font-mono font-bold text-sm break-all">
                {attestor?.url
                  ? (
                      <>
                        <Link className="text-blue-500 underline" href={attestor.url}>
                          {attestation.signer}
                        </Link>
                        <span className="ml-1">
                          [
                          {attestor.name}
                          ]
                        </span>
                      </>
                    )
                  : attestation.signer}
              </Text>
            </div>
            <div>
              <CardDescription>Кому:</CardDescription>
              <Text className="font-mono font-bold text-sm break-all">
                {attestation.sig.message.recipient === zeroAddress
                  ? 'Нет получателя'
                  : attestation.sig.message.recipient}
              </Text>
            </div>
          </div>
          <div>
            <CardDescription>Декодированные данные:</CardDescription>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex mb-2 gap-2">
                <Badge variant="accent">
                  BYTES32
                </Badge>
                <Badge variant="accent">
                  Приватные данные
                </Badge>
              </div>
              <Text className="font-mono font-bold text-sm break-all">
                {attestation.sig.message.data}
              </Text>
            </div>
          </div>
          {children}

          <div>
            <CardDescription>Связанная аттестация:</CardDescription>
            <Text>Нет ссылок</Text>
          </div>
        </CardContent>

        <CardFooter className="border-t">
          <AttestationRawData attestation={attestation} />
        </CardFooter>
      </div>
      <AttestationQRCode className="grow" attestation={attestation} />

    </Card>
  )
}
