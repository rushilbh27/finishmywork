'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

import PublicNavbar from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { HowItWorks } from '@/components/how-it-works'
import { Testimonials } from '@/components/testimonials'
import { CTASection } from '@/components/cta-section'
import { useReducedMotion } from '@/lib/motion'

export default function Home() {
  const { status } = useSession()
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    // ✅ Redirect authenticated users to dashboard (dev + prod)
    if (status === 'authenticated') {
      router.push('/dashboard')
    }

    // ✅ Only redirect unauthenticated users to /coming-soon in production
    if (process.env.NODE_ENV === 'production' && status === 'unauthenticated') {
      router.replace('/coming-soon')
    }
  }, [status, router])

  // 🌀 Show a loading placeholder while session is being checked
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-lg">
        Loading...
      </div>
    )
  }

  // 🧑‍💻 In dev mode or when not authenticated in prod → show landing page
  return (
    <main className="relative">
      {/* Subtle animated grid background */}
      {!shouldReduceMotion && (
        <motion.div
          className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          aria-hidden="true"
        />
      )}

      {/* Actual page content */}
      <div className="relative z-10">
        <PublicNavbar />
        <div className="pt-32">
          <Hero />
          <Features />
          <HowItWorks />
          <Testimonials />
          <CTASection />
          <PublicFooter />
        </div>
      </div>
    </main>
  )
}
