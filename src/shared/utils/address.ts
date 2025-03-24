export function shortAddress(address: string, length = 8) {
  return `${address.slice(0, length)}...${address.slice(-length)}`
}
