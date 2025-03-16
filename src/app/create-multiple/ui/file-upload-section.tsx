import { Input } from '@/shared/ui/input'
import { Text } from '@/shared/ui/text'

interface FileUploadSectionProps {
  isProcessing: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function FileUploadSection({ isProcessing, onFileChange }: FileUploadSectionProps) {
  return (
    <div className="space-y-4">
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

      <Input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={onFileChange}
        disabled={isProcessing}
      />
    </div>
  )
}
