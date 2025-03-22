import type { EASAttestation } from '@/shared/lib/eas'
import { Button } from '@/shared/ui/button'
import { useState } from 'react'

export function AttestationRawData({ attestation }: { attestation: EASAttestation }) {
  const [showRawData, setShowRawData] = useState(false)
  return (
    <div className="w-full">
      <Button
        variant="outline"
        onClick={() => setShowRawData(!showRawData)}
      >
        {showRawData ? 'Скрыть исходные данные' : 'Показать исходные данные'}
      </Button>

      {showRawData && (
        <div className="mt-4 w-full bg-muted p-4 rounded-md">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(attestation, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
