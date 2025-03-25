import type { AttestationResult } from '@/shared/hooks/use-attestation-creation'
import { Button } from '@/shared/ui/button'
import { Text } from '@/shared/ui/text'
import Link from 'next/link'
import { useState } from 'react'

interface AttestationResultsProps {
  results: AttestationResult[]
  onDownloadQRCode: (qrCode: string, fio: string) => void
  onDownloadDiplomaImage: (diplomaImage: string, fio: string) => void
}

export function AttestationResults({ results, onDownloadQRCode, onDownloadDiplomaImage }: AttestationResultsProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'diploma'>('qr')

  if (results.length === 0) {
    return null
  }

  return (
    <div className="mt-8 space-y-4">
      <Text variant="h3">Созданные аттестаты</Text>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeTab === 'qr' ? 'default' : 'outline'}
          onClick={() => setActiveTab('qr')}
          size="sm"
        >
          QR-коды
        </Button>
        <Button
          variant={activeTab === 'diploma' ? 'default' : 'outline'}
          onClick={() => setActiveTab('diploma')}
          size="sm"
        >
          Дипломы
        </Button>
      </div>

      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(result => (
            <div key={result.uid} className="border rounded-md p-4 flex flex-col items-center space-y-3">
              <Text className="font-medium text-center">{result.fio}</Text>
              <div className="bg-white p-2 rounded-md">
                <img src={result.qrCode} alt={`QR код для ${result.fio}`} className="w-40 h-40" />
              </div>
              <Text className="text-xs text-gray-500 truncate w-full text-center" title={result.uid}>
                UID:
                {' '}
                {result.uid.substring(0, 10)}
                ...
                {result.uid.substring(result.uid.length - 10)}
              </Text>
              <div className="flex flex-col w-full space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadQRCode(result.qrCode, result.fio)}
                  className="w-full"
                >
                  Скачать QR-код
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Link href={result.url}>Просмотр аттестата</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Link href={result.privateUrl}>Приватная ссылка на аттестат</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'diploma' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map(result => (
            <div key={result.uid} className="border rounded-md p-4 flex flex-col items-center space-y-3">
              <Text className="font-medium text-center">{result.fio}</Text>
              {result.diplomaImage && (
                <div className="bg-white p-2 rounded-md max-w-full overflow-hidden">
                  <img
                    src={result.diplomaImage}
                    alt={`Диплом для ${result.fio}`}
                    className="max-w-full h-auto"
                  />
                </div>
              )}
              <div className="flex flex-col w-full space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadDiplomaImage(result.diplomaImage || '', result.fio)}
                  className="w-full"
                  disabled={!result.diplomaImage}
                >
                  Скачать изображение диплома
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
