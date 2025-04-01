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
  const { revoke, isPending: attestationValidationPending, error: attestationValidationError } = useAttestationValidity(fragments.attestation)
  const { revoke: refRevoke, error: refAttestationValidationError } = useAttestationValidity(fragments.refAttestation)

  const contextValue: FragmentsContextValue | null = useMemo(() => {
    if (!fragments.attestation)
      return null

    // Create the context value with proper typing
    const enhancedAttestation = { ...fragments.attestation, revoke }

    // Handle refAttestation properly - it might be null
    const enhancedRefAttestation = fragments.refAttestation
      ? { ...fragments.refAttestation, revoke: refRevoke }
      : null

    return {
      ...fragments,
      attestation: enhancedAttestation,
      refAttestation: enhancedRefAttestation,
    }
  }, [fragments, revoke, refRevoke])

  if (loading || attestationValidationPending) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Text>Загрузка аттестации...</Text>
        </div>
      </PageContainer>
    )
  }

  if (error || attestationValidationError || refAttestationValidationError) {
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
