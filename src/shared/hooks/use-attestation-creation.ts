import type { MerkleValue } from '@ethereum-attestation-service/eas-sdk'
import type { AttestationRecord } from './use-attestation-file-upload'
import { env } from '@/env'
import { eas } from '@/shared/lib/eas'
import { createOffchainURL } from '@ethereum-attestation-service/eas-sdk'
import QRCode from 'qrcode'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSigner } from './use-signer'

// Define the structure for attestation result with QR code
export interface AttestationResult {
  uid: string
  recipient: string
  fio: string
  qrCode: string
  merkleData: {
    relatedUid: string
    root: string
    values: MerkleValue[]
  }
  url: string
}

export function useAttestationCreation() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [attestationResults, setAttestationResults] = useState<AttestationResult[]>([])
  const signer = useSigner()

  // Generate QR code from attestation data
  const generateQRCode = async (data: any): Promise<string> => {
    try {
      // Convert data to JSON string
      const jsonData = JSON.stringify(data)
      // Generate QR code as data URL
      return await QRCode.toDataURL(jsonData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
      })
    }
    catch (error) {
      console.error('Error generating QR code:', error)
      return ''
    }
  }

  // Process all attestations
  const processAttestations = async (records: AttestationRecord[], address?: string) => {
    if (!address || !signer) {
      toast.error('Подключите кошелек')
      return
    }

    if (records.length === 0) {
      toast.error('Нет записей для обработки')
      return
    }

    setIsProcessing(true)
    setProgress(5)
    // Clear previous results
    setAttestationResults([])

    try {
      // Connect to EAS with the signer
      eas.connect(signer)
      const offChain = await eas.getOffchain()

      // Import EAS SDK components
      const { PrivateData, SchemaEncoder } = await import('@ethereum-attestation-service/eas-sdk')

      setProgress(10)

      // Prepare all attestation data
      const attestationRequests = await Promise.all(records.map(async (record) => {
        // Ensure recipient address is a valid Ethereum address (not an ENS name)
        const recipient = record.to
        if (!recipient.startsWith('0x') || recipient.length !== 42) {
          throw new Error(`Неверный адрес получателя: ${recipient}`)
        }

        // Create merkle tree for private data
        const merkle: MerkleValue[] = [
          { type: 'string', name: 'degree', value: record.degree },
          { type: 'string', name: 'fio', value: record.fio },
          { type: 'string', name: 'faculty', value: record.faculty },
          { type: 'string', name: 'program', value: record.program },
          { type: 'string', name: 'diploma_theme', value: record.diploma_theme },
          { type: 'uint256', name: 'date', value: record.date },
        ]

        const privateData = new PrivateData(merkle)
        const fullTree = privateData.getFullTree()
        const schemaEncoder = new SchemaEncoder('bytes32 privateData')
        const encodedData = schemaEncoder.encodeData([{ name: 'privateData', value: fullTree.root, type: 'bytes32' }])

        return {
          recipient,
          expirationTime: 0n,
          revocable: true,
          data: encodedData,
          time: BigInt(Math.floor(Date.now() / 1000)),
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          schema: env.NEXT_PUBLIC_DIPLOMA_SCHEMA_UID,
          merkleValues: merkle,
          merkleRoot: fullTree.root,
          record,
        }
      }))

      setProgress(30)

      // Process attestations in batches to avoid overwhelming the system
      const totalAttestations = attestationRequests.length
      const attestationResults: AttestationResult[] = []
      const errors: { index: number, error: string }[] = []

      // Process attestations in batches
      const batchSize = 5
      const batches = Math.ceil(totalAttestations / batchSize)

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const start = batchIndex * batchSize
        const end = Math.min(start + batchSize, totalAttestations)
        const batchRequests = attestationRequests.slice(start, end)

        // Process each attestation in the current batch
        const batchResults = await Promise.allSettled(
          batchRequests.map(async (request, index) => {
            try {
              const offchainAttestation = await offChain.signOffchainAttestation(
                {
                  schema: request.schema,
                  recipient: request.recipient,
                  expirationTime: request.expirationTime,
                  revocable: request.revocable,
                  data: request.data,
                  time: request.time,
                  refUID: request.refUID,
                },
                signer,
              )

              const url = createOffchainURL({
                sig: offchainAttestation,
                signer: address,
              })

              // Create the merkle data object for QR code
              const merkleData = {
                relatedUid: offchainAttestation.uid,
                root: request.merkleRoot,
                values: request.merkleValues,
              }

              // Generate QR code with the merkle data
              const qrCode = await generateQRCode(merkleData)

              return {
                uid: offchainAttestation.uid,
                recipient: request.recipient,
                fio: request.record.fio,
                qrCode,
                merkleData,
                url,
              }
            }
            catch (error) {
              throw new Error(`Ошибка в записи ${start + index + 1}: ${(error as Error).message}`)
            }
          }),
        )

        // Process results from this batch
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            attestationResults.push(result.value)
          }
          else {
            errors.push({
              index: start + index,
              error: result.reason.message,
            })
          }
        })

        // Update attestation results state
        setAttestationResults([...attestationResults])

        // Update progress
        const progressValue = 30 + Math.floor(((batchIndex + 1) / batches) * 70)
        setProgress(progressValue)
      }

      // Log results
      console.log('Успешно созданные аттестации:', attestationResults)
      if (errors.length > 0) {
        console.error('Ошибки при создании аттестаций:', errors)
      }

      // Show success/error message
      if (attestationResults.length === totalAttestations) {
        toast.success(`Успешно создано ${attestationResults.length} оффчейн аттестаций`)
      }
      else if (attestationResults.length > 0) {
        toast.success(`Создано ${attestationResults.length} из ${totalAttestations} аттестаций`)
        toast.error(`${errors.length} аттестаций не удалось создать`)
      }
      else {
        toast.error('Не удалось создать ни одной аттестации')
      }

      setProgress(100)
    }
    catch (error) {
      console.error('Ошибка при обработке аттестаций:', error)
      toast.error(`Ошибка: ${(error as Error).message}`)
    }
    finally {
      setIsProcessing(false)
    }
  }

  // Function to download QR code
  const downloadQRCode = (qrCode: string, fio: string) => {
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `attestation-${fio.replace(/\s+/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    isProcessing,
    progress,
    attestationResults,
    setAttestationResults,
    processAttestations,
    downloadQRCode,
  }
}
