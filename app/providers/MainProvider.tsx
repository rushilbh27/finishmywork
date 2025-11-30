'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/toaster'

export function MainProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {mounted && (
          <>
            {children}
            <Toaster />
          </>
        )}
      </ThemeProvider>
    </SessionProvider>
  )
}