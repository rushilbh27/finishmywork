'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { NotificationProvider } from '@/components/NotificationProvider'
import { ReactNode } from 'react'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}
