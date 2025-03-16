'use client'
import type { MerkleValue } from '@ethereum-attestation-service/eas-sdk'
import { env } from '@/env'
import { useSigner } from '@/shared/hooks/useSigner'
import { eas } from '@/shared/lib/eas'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/page-container'
import { Progress } from '@/shared/ui/progress'
import { Text } from '@/shared/ui/text'
import { createOffchainURL } from '@ethereum-attestation-service/eas-sdk'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { z } from 'zod'

// Define the structure for a single attestation record
interface AttestationRecord {
  degree: string
  fio: string
  faculty: string
  program: string
  diploma_theme: string
  date: number
  to: string
}

// Define the structure for attestation result with QR code
interface AttestationResult {
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

// Simple validation schema
const recordSchema = z.object({
  degree: z.string().min(1),
  fio: z.string().min(1),
  faculty: z.string().min(1),
  program: z.string().min(1),
  diploma_theme: z.string().min(1),
  date: z.coerce.number(),
  to: z.string().startsWith('0x'),
})

export default function Page() {
  const { address } = useAppKitAccount()
  const { open } = useAppKit()
  const signer = useSigner()
  const [records, setRecords] = useState<AttestationRecord[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [attestationResults, setAttestationResults] = useState<AttestationResult[]>([])

  // Handle wallet connection
  const handleConnectWallet = () => {
    open()
  }

  // Parse CSV or XLSX file
  const parseFile = async (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        let parsedData: Record<string, any>[] = []

        // Parse based on file extension
        if (file.name.endsWith('.csv')) {
          // For CSV files
          const csvText = data as string
          const lines = csvText.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())

          parsedData = lines.slice(1).filter(line => line.trim()).map((line) => {
            const values = line.split(',').map(v => v.trim())
            const record: Record<string, any> = {}

            headers.forEach((header, index) => {
              record[header] = values[index] || ''
            })

            return record
          })
        }
        else {
          // For XLSX files - updated to work with ArrayBuffer
          const arrayBuffer = data as ArrayBuffer
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          parsedData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)
        }

        // Validate and convert records
        const validRecords: AttestationRecord[] = []
        const errors: string[] = []

        parsedData.forEach((record, index) => {
          try {
            const validRecord = recordSchema.parse({
              degree: record.degree,
              fio: record.fio,
              faculty: record.faculty,
              program: record.program,
              diploma_theme: record.diploma_theme,
              date: record.date,
              to: record.to,
            })
            validRecords.push(validRecord)
          }
          catch (error) {
            errors.push(`Ошибка в строке ${index + 2}: ${(error as Error).message}`)
          }
        })

        if (errors.length > 0) {
          toast.error(`Найдено ${errors.length} ошибок в файле`)
          console.error(errors)
        }

        // Limit to 100 records
        const limitedRecords = validRecords.slice(0, 100)
        setRecords(limitedRecords)
        // Clear previous attestation results when loading new data
        setAttestationResults([])

        if (limitedRecords.length > 0) {
          toast.success(`Загружено ${limitedRecords.length} записей`)
        }
        else {
          toast.error('Не найдено корректных записей в файле')
        }
      }
      catch (error) {
        console.error('Ошибка при обработке файла:', error)
        toast.error('Ошибка при обработке файла. Проверьте формат.')
      }
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    }
    else {
      reader.readAsArrayBuffer(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      parseFile(selectedFile)
    }
  }

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

  // Process all attestations in a single transaction
  const processAttestations = async () => {
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

      // Since we can't do multiple offchain attestations in one transaction,
      // we'll create a batch-like approach with progress tracking
      const totalAttestations = attestationRequests.length
      const attestationResults: AttestationResult[] = []
      const errors: { index: number, error: string }[] = []

      // Process attestations in batches to avoid overwhelming the system
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
              console.log(url)

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

  return (
    <PageContainer>
      <Text as="h2" variant="h2">Создание множественных аттестатов</Text>
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-2">
          <Text>Загрузите CSV или XLSX файл с данными для аттестатов (до 100 записей)</Text>
          <Text type="muted">
            Файл должен содержать колонки: degree, fio, faculty, program, diploma_theme, date, to
          </Text>
          <div>
            <a href="/diploma_template.csv" download className="text-primary hover:underline">
              Скачать шаблон CSV
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            disabled={isProcessing}
          />

          {records.length > 0 && (
            <div className="space-y-4">
              <Text>
                Загружено
                {records.length}
                {' '}
                записей
              </Text>

              {/* Simple table to display records */}
              <div className="border rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Степень</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Факультет</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Программа</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Адрес</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.slice(0, 10).map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{record.fio}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{record.degree}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{record.faculty}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{record.program}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-xs">{record.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {records.length > 10 && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center border-t">
                    Показано 10 из
                    {' '}
                    {records.length}
                    {' '}
                    записей
                  </div>
                )}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Text>Обработка аттестатов...</Text>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          )}

          {address
            ? (
                <Button
                  onClick={processAttestations}
                  disabled={isProcessing || records.length === 0}
                  className="w-full"
                >
                  {isProcessing ? 'Обработка...' : 'Создать аттестаты'}
                </Button>
              )
            : (
                <Button onClick={handleConnectWallet} className="w-full">
                  Подключить кошелек
                </Button>
              )}

          {/* Display QR codes for successful attestations */}
          {attestationResults.length > 0 && (
            <div className="mt-8 space-y-4">
              <Text as="h3" variant="h3">Созданные аттестаты с QR-кодами</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attestationResults.map((result, index) => (
                  <div key={index} className="border rounded-md p-4 flex flex-col items-center space-y-3">
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
                        onClick={() => downloadQRCode(result.qrCode, result.fio)}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
