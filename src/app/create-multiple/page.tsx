'use client'
import { downloadDiplomaImage, downloadQRCode, useAttestationCreation } from '@/shared/hooks/use-attestation-creation'
import { useAttestationFileUpload } from '@/shared/hooks/use-attestation-file-upload'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { AttestationResults } from './ui/attestation-results'
import { FileUploadSection } from './ui/file-upload-section'
import { ProcessingIndicator } from './ui/processing-indicator'
import { RecordsTable } from './ui/records-table'

export default function Page() {
  const { address } = useAppKitAccount()
  const { open } = useAppKit()

  // Custom hooks for file upload and attestation creation
  const { records, handleFileChange, originalFileFormat } = useAttestationFileUpload()
  const {
    isProcessing,
    progress,
    attestationResults,
    processAttestations,
  } = useAttestationCreation()

  // Handle wallet connection
  const handleConnectWallet = () => {
    open()
  }

  // Handle attestation creation
  const handleCreateAttestations = () => {
    processAttestations(records, address, originalFileFormat || undefined)
  }

  return (
    <PageContainer>
      <Text variant="h2">Создание группы аттестатов</Text>
      <div className="w-full max-w-4xl space-y-6">
        <FileUploadSection
          isProcessing={isProcessing}
          onFileChange={handleFileChange}
        />

        <RecordsTable records={records} />

        <ProcessingIndicator
          isProcessing={isProcessing}
          progress={progress}
        />

        {address
          ? (
              <Button
                onClick={handleCreateAttestations}
                disabled={isProcessing || records.length === 0}
                className="w-full"
              >
                {isProcessing ? 'Обработка...' : records.length === 0 ? 'Загрузите файл' : 'Создать аттестаты'}
              </Button>
            )
          : (
              <Button onClick={handleConnectWallet} className="w-full">
                Подключить кошелек
              </Button>
            )}

        <AttestationResults
          results={attestationResults}
          onDownloadQRCode={downloadQRCode}
          onDownloadDiplomaImage={downloadDiplomaImage}
        />
      </div>
    </PageContainer>
  )
}
