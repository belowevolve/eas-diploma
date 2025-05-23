import type { MerkleValue } from '@ethereum-attestation-service/eas-sdk'
import { FRAGMENTS, routes } from '@/shared/config/ROUTES'
import { useMerkleProof } from '@/shared/hooks/use-merkle-proof'
import { renderMerkleValue } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { CardDescription } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Text } from '@/shared/ui/text'
import { encodeUriFragment } from '@/shared/utils/uri-fragment'
import { useState } from 'react'
import { toast } from 'sonner'

interface PrivateDataProofProps {
  privateData: MerkleValue[]
}

export function PrivateDataProof({ privateData }: PrivateDataProofProps) {
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const { generateProof, proofResult } = useMerkleProof(privateData)

  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const handleRowSelect = (index: number) => {
    setSelectedRows(prev =>
      prev.includes(index)
        ? prev.filter(row => row !== index)
        : [...prev, index],
    )
  }

  const handleGenerateProof = () => {
    generateProof(selectedRows)
  }

  const handleCopyLink = async () => {
    const uriFragment = window.location.hash

    const parts = uriFragment.split(FRAGMENTS.attestation)
    let paramValue = parts[1]
    const nextParamIndex = paramValue.indexOf('&')
    if (nextParamIndex !== -1) {
      paramValue = paramValue.substring(0, nextParamIndex)
    }

    const attestation = decodeURIComponent(paramValue)

    if (!proofResult || !attestation)
      return

    try {
      const url = `${location.origin}${routes.offchainView({
        attestation,
        proofs: encodeUriFragment(proofResult),
      })}`

      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      toast.success('Ссылка с доказательством скопирована в буфер обмена')

      // Сбросить статус успешного копирования через 2 секунды
      setTimeout(() => setCopySuccess(false), 2000)
    }
    catch {
      toast.error('Не удалось скопировать ссылку')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <CardDescription className="underline">Приватные данные</CardDescription>
        <Text className="text-sm text-gray-600 mb-4">
          Данные видны только тем, кто имеет доказательство. Выберите строку(и) для генерации доказательства.
        </Text>
      </div>

      <div className="bg-blue-50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-100">
            <tr>
              <th className="p-3 text-left">Доказательство</th>
              <th className="p-3 text-left">Имя</th>
              <th className="p-3 text-left">Значение</th>
            </tr>
          </thead>
          <tbody>
            {privateData?.map((item, index) => (
              <tr key={index} className="border-t border-blue-100">
                <td className="p-3">
                  <Checkbox
                    checked={selectedRows.includes(index)}
                    onCheckedChange={() => handleRowSelect(index)}
                  />
                </td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{renderMerkleValue(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        {proofResult && (
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className={copySuccess ? 'bg-green-100' : ''}
          >
            {copySuccess ? 'Ссылка скопирована!' : 'Скопировать ссылку'}
          </Button>
        )}
        <Button onClick={handleGenerateProof}>
          Сгенерировать доказательство
        </Button>
      </div>

      {proofResult && (
        <div className="mt-4">
          <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-2">PROOF RESULT</Text>
          <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(proofResult, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
