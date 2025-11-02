import * as React from 'react'
import { cn } from '@/lib/utils'

export function GradientText({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent', className)}>
      {children}
    </span>
  )
}
