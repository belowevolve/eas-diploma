import type { VariantProps } from 'cva'
import { cn } from '@/shared/lib/cn'
import { cva } from 'cva'
import * as React from 'react'

const textVariants = cva({
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      // h4: 'text-xl font-bold',
      // h5: 'text-lg font-bold',
      // h6: 'text-base font-bold',
      p: '',
      b: 'text-xs font-bold',
    },
    type: {
      secondary: 'text-secondary-foreground',
      accent: 'text-accent-foreground',
      muted: 'text-muted-foreground',
    },
    add: {
      icon: 'inline-flex items-center gap-2',
    },
  },
  defaultVariants: {
    variant: 'p',
  },
  compoundVariants: [
    {
      variant: 'p',
      className: 'text-secondary-foreground',
    },
  ],
})

export interface TextProps
  extends React.ComponentProps<'p'>,
  VariantProps<typeof textVariants> {
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span'
}

function Text({
  className,
  variant,
  as,
  type,
  add,
  ...props
}: TextProps) {
  const Comp = as || variant || 'p'
  return (
    <Comp
      className={cn(textVariants({ variant, type, add, className }))}
      {...props}
    />
  )
}
Text.displayName = 'Text'

export { Text, textVariants }
