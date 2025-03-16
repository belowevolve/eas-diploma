import { Base64 } from 'js-base64'
import { deflate, inflate } from 'pako'

export function encodeUriFragment<T>(data: T): string {
  const jsoned = JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  const gzipped = deflate(jsoned, { level: 9 })
  const dataEncoded = Base64.fromUint8Array(gzipped)
  return dataEncoded
}

export function decodeUriFragment<T>(fragment: string): T {
  const gzipped = Base64.toUint8Array(fragment)
  const jsoned = inflate(gzipped, { to: 'string' })
  return JSON.parse(jsoned)
}
