'use client'
import { useState } from 'react'
import { env } from '@/env'
import { useSigner } from '@/shared/hooks/useSigner'
import { eas } from '@/shared/lib/eas'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/page-container'
import { Progress } from '@/shared/ui/progress'
import { Text } from '@/shared/ui/text'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { MerkleValue } from '@ethereum-attestation-service/eas-sdk'

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
          
          parsedData = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim())
            const record: Record<string, any> = {}
            
            headers.forEach((header, index) => {
              record[header] = values[index] || ''
            })
            
            return record
          })
        } else {
          // For XLSX files
          const workbook = XLSX.read(data, { type: 'binary' })
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
          } catch (error) {
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
        
        if (limitedRecords.length > 0) {
          toast.success(`Загружено ${limitedRecords.length} записей`)
        } else {
          toast.error('Не найдено корректных записей в файле')
        }
      } catch (error) {
        console.error('Ошибка при обработке файла:', error)
        toast.error('Ошибка при обработке файла. Проверьте формат.')
      }
    }
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      parseFile(selectedFile)
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
    setProgress(10)
    
    try {
      eas.connect(signer)
      
      // Import EAS SDK components
      const { PrivateData, SchemaEncoder } = await import('@ethereum-attestation-service/eas-sdk')
      
      setProgress(30)
      
      // Prepare all attestation data
      const attestationData = await Promise.all(records.map(async (record) => {
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
          recipient: record.to,
          expirationTime: 0n,
          revocable: true,
          data: encodedData,
        }
      }))
      
      setProgress(60)
      
      // Create a single multiAttest transaction for all records
      const transaction = await eas.multiAttest([
        {
          schema: env.NEXT_PUBLIC_DIPLOMA_SCHEMA_UID,
          data: attestationData,
        },
      ])
      
      setProgress(80)
      
      // Wait for transaction to complete
      const newAttestationUIDs = await transaction.wait()
      
      console.log('New attestation UIDs:', newAttestationUIDs)
      
      setProgress(100)
      toast.success(`Успешно обработано ${records.length} аттестаций в одной транзакции`)
    } catch (error) {
      console.error('Ошибка при обработке аттестаций:', error)
      toast.error(`Ошибка: ${(error as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
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
              <Text>Загружено {records.length} записей</Text>
              
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
                    Показано 10 из {records.length} записей
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
          
          {address ? (
            <Button 
              onClick={processAttestations} 
              disabled={isProcessing || records.length === 0} 
              className="w-full"
            >
              {isProcessing ? 'Обработка...' : 'Создать аттестаты'}
            </Button>
          ) : (
            <Button onClick={handleConnectWallet} className="w-full">
              Подключить кошелек
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

