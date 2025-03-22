import type { EASAttestation } from '@/shared/lib/eas'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function AttestationQRCode({ className, attestation }: { className?: string, attestation: EASAttestation }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>()

  useEffect(() => {
    async function genQr() {
      const qrCode = await QRCode.toDataURL(window.location.href, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 720,
      })
      setQrCodeUrl(qrCode)
    }
    genQr()
  }, [])

  const downloadQRCode = () => {
    if (!qrCodeUrl)
      return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `attestation-${attestation.sig.uid}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success('Ссылка скопирована в буфер обмена')
      })
      .catch(err => console.error('Failed to copy link:', err))
  }

  const download = () => {
    const dataStr = JSON.stringify({ sig: attestation.sig, signer: attestation.signer }, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `attestation-${attestation.sig.uid}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('flex flex-col mx-auto md:w-52 gap-2 px-6', className)}>
      {qrCodeUrl && (
        <img src={qrCodeUrl} alt="QR Code" />
      )}
      <Button variant="outline" onClick={download}>
        Скачать
      </Button>
      <Button variant="outline" onClick={downloadQRCode}>
        Скачать QR
      </Button>
      <Button variant="link" onClick={copyLink}>
        Скопировать ссылку
      </Button>
    </div>
  )
}
