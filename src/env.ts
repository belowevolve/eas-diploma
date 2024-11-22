import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NEXTAUTH_SECRET: z.string().min(1),
    PRIVATE_KEY: z.string().min(1).startsWith('0x'),
    REGISTER_SCHEMA_UID: z.string().min(1).startsWith('0x'),
    PROVIDER_URL: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_EAS_CONTRACT: z.string().min(1),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_RESOLVER_CONTRACT: z.string().min(1).startsWith('0x'),
    NEXT_PUBLIC_DIPLOMA_SCHEMA_UID: z.string().min(1).startsWith('0x'),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_EAS_CONTRACT: process.env.NEXT_PUBLIC_EAS_CONTRACT,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_RESOLVER_CONTRACT: process.env.NEXT_PUBLIC_RESOLVER_CONTRACT,
    NEXT_PUBLIC_DIPLOMA_SCHEMA_UID: process.env.NEXT_PUBLIC_DIPLOMA_SCHEMA_UID,
  },
})
