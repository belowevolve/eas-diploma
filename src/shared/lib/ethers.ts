import { env } from '@/env'
import { ethers } from 'ethers'

export const provider = new ethers.JsonRpcProvider(env.PROVIDER_URL)
