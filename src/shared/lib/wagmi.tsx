import { env } from '@/env'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

export const networks = [baseSepolia]

export const wagmiAdapter = new WagmiAdapter({
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  storage: createStorage({
    storage: cookieStorage,
  }),
  networks,
  ssr: true,
})

export const config = wagmiAdapter.wagmiConfig
