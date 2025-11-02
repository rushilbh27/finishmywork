'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import React, { useEffect, useState, ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Prevents hydration mismatch
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}