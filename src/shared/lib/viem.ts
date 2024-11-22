import type { Address } from 'viem'
import { env } from '@/env'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

export const backendAccount = privateKeyToAccount(env.PRIVATE_KEY as Address)
export const backendWalletClient = createWalletClient({
  account: backendAccount,
  chain: baseSepolia,
  transport: http(),
})
