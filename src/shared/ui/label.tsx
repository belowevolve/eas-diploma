'use client'

import { cn } from '@/shared/lib/cn'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva } from 'cva'
import * as React from 'react'

const labelVariants = cva({
  base: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
},
)

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(labelVariants(), className)}
      {...props}
    />
  )
}
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
