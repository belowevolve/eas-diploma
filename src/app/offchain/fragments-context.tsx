import type { FragmentsData } from '@/shared/hooks/use-fragments-decoder'
import type { EASAttestation } from '@/shared/lib/eas'
import { createContext, useContext } from 'react'

export interface FragmentsContextValue extends FragmentsData {
  attestation: EASAttestation
}

export const FragmentsContext = createContext<FragmentsContextValue | null>(null)

export function useFragments() {
  const context = useContext(FragmentsContext)
  if (!context) {
    throw new Error('useFragments must be used within a FragmentsProvider')
  }
  return context
}
