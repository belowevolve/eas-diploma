import type { Metadata } from 'next'
import { cn } from '@/shared/lib/cn'
import { Inter as FontSans } from 'next/font/google'
import { headers } from 'next/headers'
import { LayoutProvider } from './layout-provider'
import { Navbar } from './ui/navbar'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'EAS дипломы',
  description: '',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const header = await headers()
  const cookies = header.get('cookie')
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen font-sans antialiased', fontSans.variable)}>
        <LayoutProvider cookies={cookies}>
          <Navbar />
          {children}
        </LayoutProvider>
      </body>
    </html>
  )
}
