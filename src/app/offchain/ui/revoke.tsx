import type { EASAttestation } from '@/shared/lib/eas'
import { useSigner } from '@/shared/hooks/use-signer'
import { eas } from '@/shared/lib/eas'
import { Button } from '@/shared/ui/button'
import { tryCatch } from '@/shared/utils/try-catch'
import { useAppKitAccount } from '@reown/appkit/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export function Revoke({ attestation }: { attestation: EASAttestation }) {
  const { address } = useAppKitAccount()
  const signer = useSigner()
  const qc = useQueryClient()
  const [isRevoking, setIsRevoking] = useState(false)
  const revokeAttestation = async () => {
    if (!signer) {
      toast.error('Подключите кошелек')
      return
    }
    setIsRevoking(true)
    eas.connect(signer)
    const transaction = await eas.revokeOffchain(attestation.sig.uid)
    const toastId = toast.loading('Отзываем аттестацию...')
    const result = await tryCatch<bigint, { reason: 'rejected' }>(transaction.wait())
    setIsRevoking(false)
    if (result.error) {
      if (result.error.reason === 'rejected') {
        toast.dismiss(toastId)
        return
      }
      toast.error('Ошибка при отзыве аттестации', { id: toastId })
      return
    }
    toast.success('Аттестация отозвана', { id: toastId })
    qc.invalidateQueries({ queryKey: attestation.revoke.queryKey })
  }

  if (address !== attestation.signer)
    return null

  return (
    <Button variant="destructive" size="xs" disabled={isRevoking} onClick={revokeAttestation}>
      Отозвать
    </Button>
  )
}
