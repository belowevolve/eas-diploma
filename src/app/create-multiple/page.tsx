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
import { formSchema } from '../create/model'

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

// Define the types for EAS SDK components
interface MerkleValue {
  type: string
  name: string
  value: string | number
}

export default function Page() {
  const { address } = useAppKitAccount()
  const { open } = useAppKit()
  const signer = useSigner()
  const [records, setRecords] = useState<AttestationRecord[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

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
        
        console.log('Parsed data:', parsedData)
        
        // Validate the data structure
        const validatedRecords: AttestationRecord[] = []
        const validationErrors: string[] = []
        
        parsedData.forEach((record: Record<string, any>, index: number) => {
          try {
            // Validate each record against the schema
            const validatedRecord = formSchema.parse({
              degree: record.degree,
              fio: record.fio,
              faculty: record.faculty,
              program: record.program,
              diploma_theme: record.diploma_theme,
              date: Number(record.date),
              to: record.to,
            })
            validatedRecords.push(validatedRecord)
          } catch (error) {
            validationErrors.push(`Row ${index + 2}: ${(error as Error).message}`)
          }
        })
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors)
          toast.error(`Found ${validationErrors.length} errors in the file`)
        } else {
          setErrors([])
        }
        
        // Limit to 100 records
        const limitedRecords = validatedRecords.slice(0, 100)
        setRecords(limitedRecords)
        setTotalCount(limitedRecords.length)
        
        if (limitedRecords.length > 0) {
          toast.success(`Loaded ${limitedRecords.length} valid records`)
        } else {
          toast.error('No valid records found in the file')
        }
      } catch (error) {
        console.error('Error parsing file:', error)
        toast.error('Error parsing file. Please check the format.')
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

  const processAttestations = async () => {
    if (!address || !signer) {
      toast.error('Подключите кошелек')
      return
    }
    
    if (records.length === 0) {
      toast.error('No valid records to process')
      return
    }
    
    setIsProcessing(true)
    setProgress(0)
    setProcessedCount(0)
    
    try {
      eas.connect(signer)
      
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        
        try {
          // Create merkle tree for private data
          const merkle: MerkleValue[] = [
            { type: 'string', name: 'degree', value: record.degree },
            { type: 'string', name: 'fio', value: record.fio },
            { type: 'string', name: 'faculty', value: record.faculty },
            { type: 'string', name: 'program', value: record.program },
            { type: 'string', name: 'diploma_theme', value: record.diploma_theme },
            { type: 'uint256', name: 'date', value: record.date },
          ]
          
          // Use the EAS SDK to create attestations
          // Note: We're using dynamic imports here to avoid TypeScript errors
          const { PrivateData, SchemaEncoder } = await import('@ethereum-attestation-service/eas-sdk')
          
          const privateData = new PrivateData(merkle)
          const fullTree = privateData.getFullTree()
          const schemaEncoder = new SchemaEncoder('bytes32 privateData')
          const encodedData = schemaEncoder.encodeData([{ name: 'privateData', value: fullTree.root, type: 'bytes32' }])
          
          // Create attestation
          const transaction = await eas.attest({
            schema: env.NEXT_PUBLIC_DIPLOMA_SCHEMA_UID,
            data: {
              recipient: record.to,
              expirationTime: 0n,
              revocable: true,
              data: encodedData,
            },
          })
          
          await transaction.wait()
          
          // Update progress
          setProcessedCount(i + 1)
          setProgress(Math.round(((i + 1) / records.length) * 100))
        } catch (error) {
          console.error(`Error processing record ${i + 1}:`, error)
          toast.error(`Error processing record ${i + 1}: ${(error as Error).message}`)
        }
      }
      
      toast.success(`Successfully processed ${processedCount} attestations`)
    } catch (error) {
      console.error('Error processing attestations:', error)
      toast.error(`Error processing attestations: ${(error as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConnectWallet = () => {
    open()
  }

  return (
    <PageContainer>
      <Text as="h2" variant="h2">Создание множественных аттестатов</Text>
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <Text>Загрузите CSV или XLSX файл с данными для аттестатов (до 100 записей)</Text>
          <Text type="muted">
            Файл должен содержать следующие колонки: degree, fio, faculty, program, diploma_theme, date, to
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
            <div className="space-y-2">
              <Text>Загружено {records.length} записей</Text>
              {errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Text as="p" className="font-semibold text-destructive">Ошибки валидации:</Text>
                  <ul className="max-h-40 overflow-y-auto space-y-1 text-sm text-destructive">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {isProcessing && (
            <div className="space-y-2">
              <Text>Обработано {processedCount} из {totalCount}</Text>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          )}
          
          {address
            ? <Button 
                onClick={processAttestations} 
                disabled={isProcessing || records.length === 0 || errors.length > 0} 
                className="w-full"
              >
                {isProcessing ? 'Обработка...' : 'Создать аттестаты'}
              </Button>
            : <Button onClick={handleConnectWallet} className="w-full">Подключите кошелек</Button>}
        </div>
      </div>
    </PageContainer>
  )
}

