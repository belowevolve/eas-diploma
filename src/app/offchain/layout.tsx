'use client'
import type { FragmentsContextValue } from './fragments-context'
import { useAttestationValidity } from '@/shared/hooks/use-attestation-validity'
import { useFragmentsDecoder } from '@/shared/hooks/use-fragments-decoder'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { useMemo } from 'react'
import { FragmentsContext } from './fragments-context'

export default function OffchainLayout({ children }: { children: React.ReactNode }) {
  const { fragments, loading, error } = useFragmentsDecoder()
  const { revoke, isPending: attestationValidationLoading, error: attestationValidationError } = useAttestationValidity(fragments.attestation)

  const contextValue: FragmentsContextValue | null = useMemo(() => {
    return fragments.attestation
      ? { ...fragments, attestation: { ...fragments.attestation, revoke } }
      : null
  }, [fragments, revoke])

  if (loading || attestationValidationLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Text>Загрузка аттестации...</Text>
        </div>
      </PageContainer>
    )
  }

  if (error || attestationValidationError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Text variant="h3" className="text-red-500">Ошибка</Text>
          <Text>{error || attestationValidationError?.message}</Text>
          <Button onClick={() => window.history.back()}>Вернуться назад</Button>
        </div>
      </PageContainer>
    )
  }

  if (!fragments.attestation) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Text variant="h3" className="text-red-500">Аттестация не найдена</Text>
          <Button onClick={() => window.history.back()}>Вернуться назад</Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <FragmentsContext value={contextValue}>
      <PageContainer>
        {children}
      </PageContainer>
    </FragmentsContext>
  )
}
