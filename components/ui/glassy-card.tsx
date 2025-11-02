import * as React from 'react'
import { cn } from '@/lib/utils'

export function GlassyCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-card transition-all',
        'hover:shadow-glow-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
