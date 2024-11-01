import { env } from '@/env'
import {
  getAddressFromMessage,
  getChainIdFromMessage,
  type SIWESession,
  verifySignature,
} from '@reown/appkit-siwe'
import NextAuth from 'next-auth'
import credentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface Session extends SIWESession {
    address: string
    chainId: number
  }
}

const providers = [
  credentialsProvider({
    name: 'Ethereum',
    credentials: {
      message: {
        label: 'Message',
        type: 'text',
        placeholder: '0x0',
      },
      signature: {
        label: 'Signature',
        type: 'text',
        placeholder: '0x0',
      },
    },
    async authorize(credentials) {
      try {
        if (!credentials?.message) {
          throw new Error('SiweMessage is undefined')
        }
        const { message, signature } = credentials
        const address = getAddressFromMessage(message)
        const chainId = getChainIdFromMessage(message)

        const isValid = await verifySignature({
          address,
          message,
          signature,
          chainId,
          projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        })

        if (isValid) {
          return {
            id: `${chainId}:${address}`,
          }
        }

        return null
      }
      catch {
        return null
      }
    },
  }),
]

const handler = NextAuth({
  // https://next-auth.js.org/configuration/providers/oauth
  secret: env.NEXTAUTH_SECRET,
  providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    session({ session, token }) {
      if (!token.sub) {
        return session
      }

      const [, chainId, address] = token.sub.split(':')
      if (chainId && address) {
        session.address = address
        session.chainId = Number.parseInt(chainId, 10)
      }

      return session
    },
  },
})

export { handler as GET, handler as POST }
