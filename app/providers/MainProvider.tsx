'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { PropsWithChildren, useEffect, useState } from 'react'

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
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(51, 65, 85, 0.9)',
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                },
              }}
            />
          </>
        )}
      </ThemeProvider>
    </SessionProvider>
  )
}