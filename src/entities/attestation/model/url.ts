import { env } from '@/env'

export const easOnchainUrl = (uid: string) => `${env.NEXT_PUBLIC_EAS_URL}/attestation/view/${uid}`
