'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function ProfileDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)] hover:opacity-90 transition-all shadow-glow"
      >
        Sign In
      </Link>
    )
  }

  const handleLogout = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    await signOut({ 
      callbackUrl: origin ? `${origin}/` : '/',
      redirect: true 
    })
  }

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200"
      >
        {session.user.avatar ? (
          <img
            src={session.user.avatar}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {getUserInitials(session.user.name || 'User')}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
          {session.user.name}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white">{session.user.name}</p>
            <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200"
            >
              <UserIcon className="w-4 h-4" />
              View Profile
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200"
            >
              <ChartBarIcon className="w-4 h-4" />
              Dashboard
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Settings
            </Link>

            <div className="border-t border-white/10 my-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors duration-200 w-full text-left"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}