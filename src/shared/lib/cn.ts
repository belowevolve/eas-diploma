import type { CXOptions } from 'cva'
import { cx } from 'cva'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: CXOptions) {
  return twMerge(cx(inputs))
}
