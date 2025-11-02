'use client'

import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/navbar'
import PublicNavbar from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { HowItWorks } from '@/components/how-it-works'
import { Testimonials } from '@/components/testimonials'
import { CTASection } from '@/components/cta-section'
import { Footer } from '@/components/footer'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/lib/motion'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  // Show public navbar/footer for unauthenticated users
  const isAuthenticated = status === 'authenticated'

  // Don't render anything while checking auth or if authenticated (will redirect)
  if (status === 'loading' || isAuthenticated) {
    return null
  }

  return (
    <main className="relative">
      {/* Animated grid background for entire homepage */}
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
            backgroundPosition: ['0px 0px', '40px 40px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          aria-hidden="true"
        />
      )}
      
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
