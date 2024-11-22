import { env } from '@/env'
import { EAS } from '@ethereum-attestation-service/eas-sdk'

// Initialize the sdk with the address of the EAS Schema contract address
export const eas = new EAS(env.NEXT_PUBLIC_EAS_CONTRACT)
