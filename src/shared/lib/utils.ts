import type { MerkleValue } from '@ethereum-attestation-service/eas-sdk'

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function renderMerkleValue(item: MerkleValue) {
  if (item.name === 'date') {
    return formatDate(new Date(item.value as number * 1000))
  }
  return item.value as string
}
