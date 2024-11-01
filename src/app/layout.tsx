import type { Metadata } from 'next'
import { cn } from '@/shared/lib/cn'
import { eas } from '@/shared/lib/eas'
import { ethers } from 'ethers'
import { Inter as FontSans } from 'next/font/google'
import { LayoutProvider } from './layout-provider'
import { Navbar } from './ui/navbar'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'EAS diplomas by belowevolve',
  description: '',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // const url = 'https://sepolia.base.org'
  // const uid = '0xf09181170d14602458a31fb57027571c2cfb9313acb305641160f855bedc1b30'
  // const provider = new ethers.JsonRpcProvider(url)
  // eas.connect(provider)

  // const attestation = await eas.getAttestation(uid)

  // console.log(attestation)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen font-sans antialiased', fontSans.variable)}>
        <LayoutProvider>
          <Navbar />
          {children}
        </LayoutProvider>
      </body>
    </html>
  )
}
