'use client'
import type { PropsWithChildren } from 'react'
import { env } from '@/env'
import { getQueryClient } from '@/shared/lib/rq'
import { siweConfig } from '@/shared/lib/siwe'
import { Toaster } from '@/shared/ui/sonner'
import { baseSepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const metadata = {
  name: 'Цифровой аттестат',
  description: 'Платформа для работы с цифровыми аттестатами',
  url: 'http://localhost:3000',
  icons: ['https://womenofrussia.online/upload/iblock/363/96vakce82nnh6rrz80803wx93lzsjaee.jpg'],
}

createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: [baseSepolia],
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  siweConfig,
  themeMode: 'light',
})

export function LayoutProvider({ children }: PropsWithChildren) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen />}
      <Toaster position="top-right" className="right-4 top-[72px]" richColors />
    </QueryClientProvider>
  )
}
