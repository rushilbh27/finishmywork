'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([])

  // Initialize GSAP timeline
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

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl flex items-center justify-between px-6 md:px-8 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl z-50 shadow-2xl">
      <div className="flex items-center gap-3">
      <img src="/logo.svg" alt="fmwlogo" className="w-10 h-10 rounded-xl shadow-lg" />
        <div className="font-semibold tracking-wide text-white text-lg">FinishMyWork</div>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
        <a href="#features" className="hover:text-white transition-colors cursor-pointer">
          Features
        </a>
        <a href="#how-it-works" className="hover:text-white transition-colors cursor-pointer">
          How It Works
        </a>
        <Link href="/auth/signin" className="hover:text-white transition-colors cursor-pointer">
          Sign In
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="/auth/signup"
          className="hidden sm:block px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all text-sm relative overflow-hidden group cursor-pointer"
        >
          <span className="relative z-10">Sign Up</span>
        </Link>

        {/* Mobile Menu Button (two-line hamburger) */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden flex flex-col gap-1.5 p-2 cursor-pointer ${mobileMenuOpen ? 'hamburger-open' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="w-6 h-0.5 bg-white rounded hamburger-line"></span>
          <span className="w-6 h-0.5 bg-white rounded hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown (attached to navbar) */}
      <div 
        ref={dropdownRef} 
        className="md:hidden absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[95%] max-w-7xl bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl z-50 shadow-2xl overflow-hidden pointer-events-none" 
        style={{ height: 0, opacity: 0 }}
      >
        <div className="p-4 relative pointer-events-auto">
          <nav className="divide-y divide-white/6">
            <div ref={el => { menuItemsRef.current[0] = el }} className="py-3">
              <ul className="space-y-3">
                <li>
                  <a 
                    href="#features" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a 
                    href="#how-it-works" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <Link 
                    href="/auth/signin" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div ref={el => { menuItemsRef.current[1] = el }} className="mt-5 border-t border-white/8 pt-4">
              <div className="text-slate-400 uppercase tracking-wide text-xs mb-2">Get Started</div>
              <Link 
                href="/auth/signup" 
                onClick={() => setMobileMenuOpen(false)} 
                className="block w-full text-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold shadow-lg shadow-purple-500/30"
              >
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </nav>
  )
}
