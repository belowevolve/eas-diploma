import type { MerkleValue } from '@ethereum-attestation-service/eas-sdk'
import type { AttestationRecord } from './use-attestation-file-upload'
import { env } from '@/env'
import { eas } from '@/shared/lib/eas'
import { encodeUriFragment } from '@/shared/utils/uri-fragment'
import { zipAndEncodeToBase64 } from '@ethereum-attestation-service/eas-sdk'
import QRCode from 'qrcode'
import { useState } from 'react'
import { toast } from 'sonner'
import { sha256, zeroAddress, zeroHash } from 'viem'
import { routes } from '../config/ROUTES'
import { formatDate } from '../lib/utils'
import { useSigner } from './use-signer'

const BATCH_SIZE = 5
// Define the structure for attestation result with QR code
export interface AttestationResult {
  uid: string
  recipient: string
  fio: string
  qrCode: string
  url: string
  privateUrl: string
  diplomaImage?: string
  diplomaImageHash?: string
  degree?: string
  faculty?: string
  program?: string
  diploma_theme?: string
  date?: number
}

// Function to generate an image with diploma information
async function generateDiplomaImage(data: {
  uid: string
  fio: string
  degree: string
  faculty: string
  program: string
  diploma_theme: string
  date: number
}): Promise<{ image: string, hash: string }> {
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Set background
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 10
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    // Set text style
    ctx.fillStyle = '#1f2937'
    ctx.textAlign = 'center'

    // Add header
    ctx.font = 'bold 36px Arial'
    ctx.fillText('Диплом', canvas.width / 2, 80)

    // Add content
    ctx.font = '20px Arial'
    const lineHeight = 40
    let y = 150

    // Format date
    const formattedDate = formatDate(new Date(data.date * 1000))

    // Add details
    ctx.textAlign = 'center'
    ctx.fillText(`${data.fio}`, canvas.width / 2, y)
    y += lineHeight
    ctx.fillText(`Степень: ${data.degree}`, canvas.width / 2, y)
    y += lineHeight
    ctx.fillText(`Факультет: ${data.faculty}`, canvas.width / 2, y)
    y += lineHeight
    ctx.fillText(`Программа: ${data.program}`, canvas.width / 2, y)
    y += lineHeight

    // Add diploma theme with word wrap
    const maxWidth = 700
    const words = data.diploma_theme.split(' ')
    let line = ''
    ctx.fillText(`Тема диплома:`, canvas.width / 2, y)
    y += 30

    for (let i = 0; i < words.length; i++) {
      const testLine = `${line + words[i]} `
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, canvas.width / 2, y)
        line = `${words[i]} `
        y += 30
      }
      else {
        line = testLine
      }
    }
    ctx.fillText(line, canvas.width / 2, y)
    y += lineHeight

    ctx.fillText(`Дата выдачи: ${formattedDate}`, canvas.width / 2, y)
    y += lineHeight

    // Add UID at the bottom
    ctx.font = '14px Arial'
    ctx.fillText(`ID: ${data.uid}`, canvas.width / 2, y + 20)

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob)
          resolve(blob)
      }, 'image/png')
    })

    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer()

    // Calculate SHA-256 hash
    const hash = sha256(new Uint8Array(arrayBuffer))

    // Convert canvas to data URL
    const image = canvas.toDataURL('image/png')

    return { image, hash }
  }
  catch (error) {
    console.error('Error generating diploma image:', error)
    return { image: '', hash: '' }
  }
}

// Generate QR code from attestation data
async function generateQRCode(data: any): Promise<string> {
  try {
    // Convert data to JSON string
    const jsonData = JSON.stringify(data)
    // Generate QR code as data URL
    return await QRCode.toDataURL(jsonData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 720,
    })
  }
  catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}

// Function to download QR code
export function downloadQRCode(qrCode: string, fio: string) {
  const link = document.createElement('a')
  link.href = qrCode
  link.download = `attestation-${fio.replace(/\s+/g, '-')}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Function to download diploma image
export function downloadDiplomaImage(diplomaImage: string, fio: string) {
  if (!diplomaImage) {
    toast.error('Изображение диплома не найдено')
    return
  }

  const link = document.createElement('a')
  link.href = diplomaImage
  link.download = `diploma-${fio.replace(/\s+/g, '-')}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function useAttestationCreation() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [attestationResults, setAttestationResults] = useState<AttestationResult[]>([])
  const signer = useSigner()

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
    setAttestationResults([])

    try {
      eas.connect(signer)
      const offChain = await eas.getOffchain()
      const { PrivateData, SchemaEncoder } = await import('@ethereum-attestation-service/eas-sdk')

      setProgress(10)

      const attestationRequests = await Promise.all(records.map(async (record) => {
        const recipient = record.to || zeroAddress
        if (!recipient.startsWith('0x') || recipient.length !== 42) {
          throw new Error(`Неверный адрес получателя: ${recipient}`)
        }

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
          refUID: zeroHash,
          schema: env.NEXT_PUBLIC_DIPLOMA_SCHEMA_UID,
          merkle: fullTree,
          record,
        }
      }))

      setProgress(30)

      const totalAttestations = attestationRequests.length
      const attestationResults: AttestationResult[] = []
      const errors: { index: number, error: string }[] = []

      const batches = Math.ceil(totalAttestations / BATCH_SIZE)

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const start = batchIndex * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, totalAttestations)
        const batchRequests = attestationRequests.slice(start, end)

        const batchResults: PromiseSettledResult<AttestationResult>[] = await Promise.allSettled(
          batchRequests.map(async (request, index) => {
            try {
              const offchainAttestation = await offChain.signOffchainAttestation(
                {
                  schema: request.schema,
                  recipient: request.recipient ?? zeroAddress,
                  expirationTime: request.expirationTime,
                  revocable: request.revocable,
                  data: request.data,
                  time: request.time,
                  refUID: request.refUID,
                },
                signer,
                {
                  verifyOnchain: true,
                },
              )

              const attestationEncoded = zipAndEncodeToBase64({
                sig: offchainAttestation,
                signer: address,
              })

              const merkleData = {
                relatedUid: offchainAttestation.uid,
                root: request.merkle.root,
                values: request.merkle.values,
              }

              const qrCode = await generateQRCode(merkleData)
              const merkleEncoded = encodeUriFragment(merkleData)

              const { image: diplomaImage, hash: diplomaImageHash } = await generateDiplomaImage({
                uid: offchainAttestation.uid,
                fio: request.record.fio,
                degree: request.record.degree,
                faculty: request.record.faculty,
                program: request.record.program,
                diploma_theme: request.record.diploma_theme,
                date: request.record.date,
              })

              const contentHashSchemaEncoder = new SchemaEncoder('bytes32 contentHash')
              const contentHashAttestation = await offChain.signOffchainAttestation({
                schema: env.NEXT_PUBLIC_CONTENT_HASH_SCHEMA_UID,
                recipient: address,
                expirationTime: 0n,
                revocable: true,
                data: contentHashSchemaEncoder.encodeData([{ name: 'contentHash', value: diplomaImageHash, type: 'bytes32' }]),
                time: BigInt(Math.floor(Date.now() / 1000)),
                refUID: offchainAttestation.uid,
              }, signer)

              const contentHashEncoded = zipAndEncodeToBase64({
                sig: contentHashAttestation,
                signer: address,
              })

              return {
                uid: offchainAttestation.uid,
                recipient: request.recipient,
                fio: request.record.fio,
                qrCode,
                privateUrl: routes.offchainPrivate({ attestation: attestationEncoded, merkle: merkleEncoded, refAttestation: contentHashEncoded }),
                url: routes.offchainView({ attestation: attestationEncoded, refAttestation: contentHashEncoded }),
                diplomaImage,
                diplomaImageHash,
                degree: request.record.degree,
                faculty: request.record.faculty,
                program: request.record.program,
                diploma_theme: request.record.diploma_theme,
                date: Number(request.record.date),
              }
            }
            catch (error) {
              throw new Error(`Ошибка в записи ${start + index + 1}: ${(error as Error).message}`)
            }
          }),
        )

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

        setAttestationResults([...attestationResults])
        const progressValue = 30 + Math.floor(((batchIndex + 1) / batches) * 70)
        setProgress(progressValue)
      }

      console.log('Успешно созданные аттестации:', attestationResults)
      if (errors.length > 0) {
        console.error('Ошибки при создании аттестаций:', errors)
      }

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

  return {
    isProcessing,
    progress,
    attestationResults,
    setAttestationResults,
    processAttestations,
  }
}
