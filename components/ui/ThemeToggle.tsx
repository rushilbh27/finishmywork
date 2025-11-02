'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <span className="inline-block w-8 h-8" aria-hidden />
  }

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full ring-1 ring-white/10 hover:ring-white/20 transition"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
