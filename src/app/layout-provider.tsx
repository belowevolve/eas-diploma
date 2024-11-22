'use client'
import type { PropsWithChildren } from 'react'
import { env } from '@/env'
import { getQueryClient } from '@/shared/lib/rq'
import { siweConfig } from '@/shared/lib/siwe'
import { networks, wagmiAdapter } from '@/shared/lib/wagmi'
import { Toaster } from '@/shared/ui/sonner'
import { createAppKit } from '@reown/appkit/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { cookieToInitialState, WagmiProvider } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

const metadata = {
  name: 'Цифровой аттестат',
  description: 'Платформа для работы с цифровыми аттестатами',
  url: 'http://localhost:3000',
  icons: ['https://womenofrussia.online/upload/iblock/363/96vakce82nnh6rrz80803wx93lzsjaee.jpg'],
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  networks: [baseSepolia],
  metadata,
  features: {
    analytics: false,
    swaps: false,

  },
  siweConfig,
  themeMode: 'light',
})

export function LayoutProvider({ children, cookies }: PropsWithChildren<{ cookies: string | null }>) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies)
  const queryClient = getQueryClient()
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        <Toaster position="top-right" className="right-4 top-[72px]" richColors />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
