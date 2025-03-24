'use server'
import { env } from '@/env'
import { gql, request } from 'graphql-request'
import { unstable_cache } from 'next/dist/server/web/spec-extension/unstable-cache'
import { easOnchainUrl } from '../../model/url'

const req = gql`
  query Query($where: AttestationWhereInput) {
    findFirstAttestation(where: $where) {
      id
      decodedDataJson
    }
  }
`

interface DecodedDataItem {
  name: string
  type: string
  signature: string
  value: {
    name: string
    type: string
    value: string
  }
}

async function fetchAttestor(address: string) {
  const variables = {
    where: {
      recipient: {
        equals: address,
      },
      schemaId: {
        equals: env.REGISTER_SCHEMA_UID,
      },
    },
  }
  const result = await request<{ findFirstAttestation: { id: string, decodedDataJson: string } | null }>(`${env.NEXT_PUBLIC_EAS_URL}/graphql`, req, variables)
  if (!result.findFirstAttestation) {
    return null
  }

  try {
    const decodedData = JSON.parse(result.findFirstAttestation.decodedDataJson) as DecodedDataItem[]
    const nameItem = decodedData.find(item => item.name === 'name')
    const name = nameItem?.value.value || ''

    return {
      url: easOnchainUrl(result.findFirstAttestation.id),
      name,
    }
  }
  catch {
    return {
      url: easOnchainUrl(result.findFirstAttestation.id),
      name: '',
    }
  }
}

export const getAttestor = unstable_cache(
  async (address: string) => fetchAttestor(address),

  ['attestor-url'],
  {
    revalidate: 60 * 60 * 24 * 30,
  },
)
