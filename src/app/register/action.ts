'use server'
import type { Address } from 'viem'
import type { FormSchema } from './model'
import { getAttestor } from '@/entities/attestation/api/server/get-attestor'
import { env } from '@/env'
import { RESOLVER_ABI } from '@/shared/contracts/resolver'
import { clientToProvider } from '@/shared/hooks/use-provider'
import { eas } from '@/shared/lib/eas'
import { backendAccount, backendWalletClient, publicClient } from '@/shared/lib/viem'
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import { ethers } from 'ethers'
import { formSchema } from './model'

export async function register(data: FormSchema, userAddress: Address) {
  const parsed = formSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.flatten().fieldErrors))
  }

  const attestor = await getAttestor(userAddress)
  if (attestor) {
    throw new Error('Вы уже зарегистрированы')
  }

  const resolverContractAddress = env.NEXT_PUBLIC_RESOLVER_CONTRACT as Address
  const isAttesterAllowed = await publicClient.readContract({
    address: resolverContractAddress,
    abi: RESOLVER_ABI,
    functionName: 'isAttesterAllowed',
    args: [userAddress],
  })

  if (!isAttesterAllowed) {
    const { request } = await publicClient.simulateContract({
      account: backendAccount,
      address: resolverContractAddress,
      abi: RESOLVER_ABI,
      functionName: 'addAttester',
      args: [userAddress],
    })
    await backendWalletClient.writeContract(request)
  }

  const signer = new ethers.Wallet(env.PRIVATE_KEY, clientToProvider(publicClient))
  eas.connect(signer)
  const schemaEncoder = new SchemaEncoder('string name, string description')
  const encodedData = schemaEncoder.encodeData([
    { name: 'name', value: data.name, type: 'string' },
    { name: 'description', value: data.description, type: 'string' },
  ])
  const tx = await eas.attest({
    schema: env.REGISTER_SCHEMA_UID,
    data: {
      recipient: userAddress,
      expirationTime: 0n,
      revocable: true,
      data: encodedData,
    },
  })

  const newAttestationUID = await tx.wait()

  console.log('New attestation UID:', newAttestationUID)
  return {
    newAttestationUID,
  }
}
