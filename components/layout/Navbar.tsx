'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { Moon, Sun, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import ProfileDropdown from '../ProfileDropdown'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PostTaskDialog } from '../ui/post-task-dialog'
import { NotificationBell } from '@/components/NotificationBell'

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-2">
      <div className="navbar-glass rounded-2xl shadow-glow border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group transition-transform duration-200 hover:scale-[1.02]">
              <img src="/logo.svg" alt="FinishMyWork" className="w-10 h-10 transition-transform duration-200" />
              <span className="text-2xl font-bold text-[color:var(--accent-from)] tracking-[0.015em] transition-transform duration-200">FinishMyWork</span>
            </Link>
            <div className="hidden md:flex gap-0.5 text-sm font-medium">
              <Link
                href={session?.user?.id ? '/dashboard' : '/auth/signin'}
                className={`px-1.5 py-1 rounded-md transition-colors duration-200 text-gray-300 hover:text-[color:var(--accent-from)] ${pathname === '/dashboard' ? 'text-[color:var(--accent-from)] font-semibold' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                href="/tasks"
                className={`px-1.5 py-1 rounded-md transition-colors duration-200 text-gray-300 hover:text-[color:var(--accent-from)] ${pathname === '/tasks' ? 'text-[color:var(--accent-from)] font-semibold' : ''}`}
              >
                Browse Tasks
              </Link>
              <Link
                href={session?.user?.id ? '/messages' : '/auth/signin'}
                className={`px-1.5 py-1 rounded-md transition-colors duration-200 text-gray-300 hover:text-[color:var(--accent-from)] ${pathname === '/messages' ? 'text-[color:var(--accent-from)] font-semibold' : ''}`}
              >
                Chats
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Post Task Trigger */}
            <PostTaskDialog>
              <Button variant="outline" className="rounded-2xl hidden sm:inline-flex shadow-glow hover:shadow-glow-hover px-3 py-1 text-sm">
                <Plus className="mr-1 h-3 w-3" /> Post Task
              </Button>
            </PostTaskDialog>

            {/* Notifications Bell (only for logged-in users) */}
            {session?.user?.id && <NotificationBell />}

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
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  )
}