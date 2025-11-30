'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { Moon, Sun, Plus } from 'lucide-react'
import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import ProfileDropdown from '../ProfileDropdown'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PostTaskDialog } from '../ui/post-task-dialog'
import { NotificationBell } from '@/components/NotificationBell'
import { gsap } from 'gsap'

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize GSAP timeline for mobile menu
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (dropdownRef.current) {
        gsap.set(dropdownRef.current, { height: 0, opacity: 0 })
        gsap.set(menuItemsRef.current, { opacity: 0, y: 20 })
        
        timelineRef.current = gsap.timeline({ paused: true })
          .to(dropdownRef.current, 
            { 
              height: 'auto', 
              opacity: 1, 
              duration: 0.4, 
              ease: 'power3.out',
              onStart: () => {
                if (dropdownRef.current) {
                  dropdownRef.current.style.pointerEvents = 'auto'
                }
              },
              onReverseComplete: () => {
                if (dropdownRef.current) {
                  dropdownRef.current.style.pointerEvents = 'none'
                }
              }
            }
          )
          .to(menuItemsRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.08,
            ease: 'power2.out'
          }, '-=0.2')
      }
    })

    return () => ctx.revert()
  }, [])

  // Play/reverse animation based on menu state
  useLayoutEffect(() => {
    if (timelineRef.current) {
      if (mobileMenuOpen) {
        timelineRef.current.play()
      } else {
        timelineRef.current.reverse()
      }
    }
  }, [mobileMenuOpen])

  // Show public navbar on auth pages
  if (pathname?.startsWith('/auth/')) {
    return (
      <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-full max-w-7xl px-2">
<div className="navbar-glass rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            {/* Left: Logo */}
            <div className="flex items-center gap-4 md:gap-8">
<Link href="/" className="flex items-center gap-3">
                <img src="/logo.svg" alt="FinishMyWork" className="w-9 h-9" />
                <span className="text-lg font-semibold tracking-tight text-[color:var(--accent-from)]">FinishMyWork</span>
              </Link>

              {/* Center: Navigation Links - Desktop Only */}
              <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <Link
                  href="/tasks"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${pathname === '/tasks' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  Browse Tasks
                </Link>
                <a
                  href="/#features"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition text-gray-400 hover:bgWhite/10 hover:text-white`}
                >
                  Features
                </a>
                <a
                  href="/#how-it-works"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition text-gray-400 hover:bgWhite/10 hover:text-white`}
                >
                  How It Works
                </a>
              </div>
            </div>

            {/* Right: Auth Buttons + Theme Toggle + Mobile Menu */}
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="hidden md:block">
                <Button variant="ghost" className="text-sm px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" className="hidden md:block">
                <Button className="relative overflow-hidden group btn-gradient rounded-xl px-5 py-2 text-sm shadow-glow hover:shadow-glow-hover before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 before:ease-in-out">
                  Sign Up
                </Button>
              </Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
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
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden flex flex-col gap-1.5 p-2 ${mobileMenuOpen ? 'hamburger-open' : ''}`}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="w-6 h-0.5 bg-white rounded hamburger-line"></span>
                <span className="w-6 h-0.5 bg-white rounded hamburger-line"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div 
            ref={dropdownRef} 
            className="md:hidden absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[95%] max-w-7xl max-h-[80vh] overflow-auto bg-black/80 dark:bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl z-50 shadow-2xl" 
          >
            <div className="p-4 relative">
            <nav className="divide-y divide-white/6">
              {/* Navigation Links */}
              <div ref={el => { menuItemsRef.current[0] = el }} className="py-3">
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/tasks" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                    >
                      Browse Tasks
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="/#features" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/#how-it-works" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                    >
                      How It Works
                    </a>
                  </li>
                </ul>
              </div>

              {/* Auth Buttons */}
              <div ref={el => { menuItemsRef.current[1] = el }} className="mt-5 border-t border-white/8 pt-4 space-y-3">
                <Link 
                  href="/auth/signin" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block w-full text-center px-6 py-3 rounded-full border border-white/20 bg-white/5 font-medium hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block w-full text-center px-6 py-3 rounded-full bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)] font-semibold shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            </nav>
            </div>
          </div>
        )}
      </nav>
    )
  }

  return (
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-full max-w-7xl px-2">
<div className="navbar-glass rounded-2xl shadow-lg border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-4 md:gap-8">
<Link href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="FinishMyWork" className="w-10 h-10 rounded-xl shadow-lg" />
            </Link>
            {session?.user?.id && (
              <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
                <Link
                  href="/dashboard"
                  prefetch={false}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tasks"
                  prefetch={false}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Browse Tasks
                </Link>
                <Link
                  href="/messages"
                  prefetch={false}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Chats
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Post Task Trigger */}
            <PostTaskDialog>
              <Button className="hidden sm:inline-flex px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all text-sm">
                <Plus className="mr-1 h-3 w-3" /> Post Task
              </Button>
            </PostTaskDialog>

            {/* Notifications Bell (only for logged-in users) */}
            {session?.user?.id && <NotificationBell />}

            {/* Profile Dropdown as primary user action */}
            <div className="ml-1">
              <ProfileDropdown />
            </div>
            
            {/* Mobile Menu Button */}
            {session?.user?.id && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden flex flex-col gap-1.5 p-2 ${mobileMenuOpen ? 'hamburger-open' : ''}`}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="w-6 h-0.5 bg-white rounded hamburger-line"></span>
                <span className="w-6 h-0.5 bg-white rounded hamburger-line"></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {session?.user?.id && mobileMenuOpen && (
        <div 
          ref={dropdownRef} 
          className="md:hidden absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[95%] max-w-7xl max-h-[80vh] overflow-auto bg-black/80 dark:bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl z-50 shadow-2xl" 
        >
          <div className="p-4 relative">
            <nav className="divide-y divide-white/6">
              {/* Navigation Links */}
              <div ref={el => { menuItemsRef.current[0] = el }} className="py-3">
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/dashboard" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/tasks" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                    >
                      Browse Tasks
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/messages" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                    >
                      Chats
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div ref={el => { menuItemsRef.current[1] = el }} className="mt-5 border-t border-white/8 pt-4 space-y-3">
                <PostTaskDialog>
                  <Button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)] font-semibold shadow-lg"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Post Task
                  </Button>
                </PostTaskDialog>
              
              </div>
            </nav>
          </div>
        </div>
      )}
    </nav>
  )
}