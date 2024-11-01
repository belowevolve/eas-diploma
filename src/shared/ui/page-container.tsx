import type { PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export function PageContainer({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <main className={cn('container md:pt-16 pt-4 flex flex-col items-center gap-4 md:gap-6', className)}>{children}</main>
  )
}
