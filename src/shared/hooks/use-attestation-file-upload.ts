import { useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { z } from 'zod'

// Simple validation schema
const recordSchema = z.object({
  degree: z.string().min(1),
  fio: z.string().min(1),
  faculty: z.string().min(1),
  program: z.string().min(1),
  diploma_theme: z.string().min(1),
  date: z.coerce.number(),
  to: z.string().startsWith('0x').optional(),
})

export interface AttestationRecord extends z.infer<typeof recordSchema> {}

export function useAttestationFileUpload() {
  const [records, setRecords] = useState<AttestationRecord[]>([])
  const [originalFileFormat, setOriginalFileFormat] = useState<'csv' | 'xlsx' | null>(null)

  // Parse CSV or XLSX file
  const parseFile = async (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        let parsedData: Record<string, any>[] = []
        let fileFormat: 'csv' | 'xlsx'

        // Parse based on file extension
        if (file.name.endsWith('.csv')) {
          fileFormat = 'csv'
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
          fileFormat = 'xlsx'
          // For XLSX files - updated to work with ArrayBuffer
          const arrayBuffer = data as ArrayBuffer
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // Configure XLSX to format dates as strings in the format DD.MM.YYYY
          XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false })

          // Read data with date formatting
          parsedData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            raw: false,
            dateNF: 'DD.MM.YYYY',
          })
        }

        // Set the original file format
        setOriginalFileFormat(fileFormat)

        // Validate and convert records
        const validRecords: AttestationRecord[] = []
        const errors: string[] = []

        parsedData.forEach((record, index) => {
          console.log(record)
          try {
            // Process the date based on its format
            let dateTimestamp: number

            if (typeof record.date === 'string' && record.date.includes('.')) {
              // Handle DD.MM.YYYY format
              const [day, month, year] = record.date.split('.').map(Number)
              const dateObj = new Date(year, month - 1, day)
              dateTimestamp = Math.floor(dateObj.getTime() / 1000)
            }
            else if (typeof record.date === 'number') {
              // Handle Excel numeric date directly
              // Convert Excel date (days since 1900-01-01) to JS date
              const excelEpoch = new Date(1899, 11, 30)
              const dateObj = new Date(excelEpoch)
              dateObj.setDate(excelEpoch.getDate() + record.date)
              dateTimestamp = Math.floor(dateObj.getTime() / 1000)
            }
            else {
              // Fallback to parsing as string
              dateTimestamp = Math.floor(Date.parse(record.date) / 1000)
            }

            const validRecord = recordSchema.parse({
              degree: record.degree,
              fio: record.fio,
              faculty: record.faculty,
              program: record.program,
              diploma_theme: record.diploma_theme,
              date: dateTimestamp,
              to: record.to,
            })
            validRecords.push(validRecord)
          }
          catch (error) {
            errors.push(`Ошибка в строке ${index + 2}: ${(error as Error).message}`)
          }
        })

        if (errors.length > 0) {
          toast.error(`Найдено ${errors.length} ${errors.length === 1 ? 'ошибка' : errors.length < 5 ? 'ошибки' : 'ошибок'} в файле`)
          console.error(errors)
        }

        // Limit to 100 records
        const limitedRecords = validRecords.slice(0, 100)
        setRecords(limitedRecords)

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

  return {
    records,
    setRecords,
    handleFileChange,
    originalFileFormat,
  }
}
