import { Button } from '@/shared/ui/button'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AttestationQRCodeProps {

  uid?: string
}

export function AttestationQRCode({ uid }: AttestationQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string >()
  useEffect(() => {
    async function genQr() {
      const qrCode = await QRCode.toDataURL(window.location.href, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
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
    link.download = `attestation-${uid || 'unknown'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success('Link copied to clipboard')
      })
      .catch(err => console.error('Failed to copy link:', err))
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {qrCodeUrl && (
        <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
      )}
      <div className="flex space-x-2">
        <Button variant="outline" onClick={downloadQRCode}>
          Download QR
        </Button>
        <Button variant="outline" onClick={copyLink}>
          Copy Link
        </Button>
      </div>
    </div>
  )
}
