'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function PublicNavbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-2">
      <div className="navbar-glass rounded-2xl shadow-glow border">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group transition-transform duration-200 hover:scale-[1.02]">
              <img src="/logo.svg" alt="FinishMyWork" className="w-10 h-10 transition-transform duration-200" />
              <span className="text-2xl font-bold text-[color:var(--accent-from)] tracking-[0.015em] transition-transform duration-200">FinishMyWork</span>
            </Link>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex gap-0.5 text-sm font-medium">
              <Link
                href="/tasks"
                className="px-3 py-1.5 rounded-md transition-colors duration-200 text-gray-300 hover:text-[color:var(--accent-from)]"
              >
                Browse Tasks
              </Link>
              <Link
                href="/auth/signin"
                className="px-3 py-1.5 rounded-md transition-colors duration-200 text-gray-300 hover:text-[color:var(--accent-from)]"
              >
                Post Task
              </Link>
              <a
                href="#features"
                className="px-3 py-1.5 rounded-md transition-colors duration-200 text-gray-300 hover:text-[color:var(--accent-from)]"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="px-3 py-1.5 rounded-md transition-colors duration-200 text-gray-300 hover:text-[color:var(--accent-from)]"
              >
                How It Works
              </a>
            </div>
          </div>

          {/* Right: Auth Buttons + Theme Toggle */}
          <div className="flex items-center gap-2">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-sm px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="relative overflow-hidden group btn-gradient rounded-xl px-5 py-2 text-sm shadow-glow hover:shadow-glow-hover before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 before:ease-in-out">
                Sign Up
              </Button>
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {!mounted ? (
                <div className="h-3 w-3" />
              ) : theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
