import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const AddressSchema = z.string().min(1).startsWith('0x')
export const env = createEnv({
  server: {
    NEXTAUTH_SECRET: z.string().min(1),
    PRIVATE_KEY: AddressSchema,
    REGISTER_SCHEMA_UID: AddressSchema,
    PROVIDER_URL: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_EAS_CONTRACT: AddressSchema,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_RESOLVER_CONTRACT: AddressSchema,
    NEXT_PUBLIC_DIPLOMA_SCHEMA_UID: AddressSchema,
    NEXT_PUBLIC_EAS_URL: z.string().min(1),
    NEXT_PUBLIC_CONTENT_HASH_SCHEMA_UID: AddressSchema,
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_EAS_CONTRACT: process.env.NEXT_PUBLIC_EAS_CONTRACT,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_RESOLVER_CONTRACT: process.env.NEXT_PUBLIC_RESOLVER_CONTRACT,
    NEXT_PUBLIC_DIPLOMA_SCHEMA_UID: process.env.NEXT_PUBLIC_DIPLOMA_SCHEMA_UID,
    NEXT_PUBLIC_EAS_URL: process.env.NEXT_PUBLIC_EAS_URL,
    NEXT_PUBLIC_CONTENT_HASH_SCHEMA_UID: process.env.NEXT_PUBLIC_CONTENT_HASH_SCHEMA_UID,
  },
})
