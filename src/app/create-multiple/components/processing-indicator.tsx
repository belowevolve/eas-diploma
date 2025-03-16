import { Progress } from '@/shared/ui/progress'
import { Text } from '@/shared/ui/text'

interface ProcessingIndicatorProps {
  isProcessing: boolean
  progress: number
}

export function ProcessingIndicator({ isProcessing, progress }: ProcessingIndicatorProps) {
  if (!isProcessing) {
    return null
  }

  return (
    <div className="space-y-2">
      <Text>Обработка аттестатов...</Text>
      <Progress value={progress} className="h-2 w-full" />
    </div>
  )
}
