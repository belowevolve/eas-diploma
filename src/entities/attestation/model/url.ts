import { env } from '@/env'

export const easOnchainUrl = (uid: string) => `${env.NEXT_PUBLIC_EAS_URL}/attestation/view/${uid}`

export const easSchemaUrl = (schema: string) => `${env.NEXT_PUBLIC_EAS_URL}/schema/view/${schema}`
