import type { AttestationRecord } from '@/shared/hooks/use-attestation-file-upload'
import { Text } from '@/shared/ui/text'

interface RecordsTableProps {
  records: AttestationRecord[]
}

export function RecordsTable({ records }: RecordsTableProps) {
  if (records.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <Text>
        Загружено
        {' '}
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
  )
}
