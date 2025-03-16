import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Text } from '@/shared/ui/text'
import { MerkleValue, MerkleMultiProof } from '@ethereum-attestation-service/eas-sdk'
import { useState } from 'react'


interface PrivateDataProofProps {
  privateData?: MerkleValue[]
  onGenerateProof: (selectedRows: number[]) => void
  proofResult?: MerkleMultiProof | null
}

export function PrivateDataProof({ privateData, onGenerateProof, proofResult }: PrivateDataProofProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([])

  const handleRowSelect = (index: number) => {
    setSelectedRows(prev =>
      prev.includes(index)
        ? prev.filter(row => row !== index)
        : [...prev, index],
    )
  }

  const handleGenerateProof = () => {
    onGenerateProof(selectedRows)
  }

  return (
    <div className="space-y-4">
      <div>
        <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-2">PRIVATE DATA</Text>
        <Text className="text-sm text-gray-600 mb-4">
          This data is only visible to those who hold the proofs. Select row(s) to generate a proof.
        </Text>
      </div>

      <div className="bg-blue-50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-100">
            <tr>
              <th className="p-3 text-left">Prove</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Value</th>
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
                <td className="p-3">{item.value as any}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleGenerateProof}>
          Generate Proof
        </Button>
      </div>

      {proofResult && (
        <div className="mt-4">
          <Text as="h3" className="text-gray-500 uppercase text-sm font-medium mb-2">PROOF RESULT</Text>
          <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(proofResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
