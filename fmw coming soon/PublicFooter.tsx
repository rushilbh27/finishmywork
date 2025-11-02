// Restored from components/layout/PublicFooter.tsx
'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, useReducedMotion } from '@/lib/motion'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()
  const shouldReduceMotion = useReducedMotion()

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1] as const
      }
    })
  }

  return (
    <footer className="relative w-full border-t border-border/60 backdrop-blur-2xl bg-card/85 overflow-hidden">
      {/* Animated grid overlay */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
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

      {/* Soft glow divider */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, color-mix(in oklab, var(--brand-blue) 30%, transparent) 50%, transparent)'
        }}
        aria-hidden="true"
      />

      <motion.div 
        className="container mx-auto px-4 py-12"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div 
            className="space-y-4"
            custom={0}
            variants={columnVariants}
          >
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="FinishMyWork Logo" className="w-7 h-7" />
              <span className="text-lg font-bold tracking-[0.015em]">FinishMyWork</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connect students for task completion and skill development.
            </p>
          </motion.div>

          {/* Company Links */}
          <motion.div 
            className="space-y-4"
            custom={1}
            variants={columnVariants}
          >
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div 
            className="space-y-4"
            custom={2}
            variants={columnVariants}
          >
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Social Links */}
          <motion.div 
            className="space-y-4"
            custom={3}
            variants={columnVariants}
          >
            <h4 className="font-semibold">Follow Us</h4>
            <div className="flex gap-4">
              <motion.a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                whileHover={shouldReduceMotion ? {} : { scale: 1.1, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              >
                <Facebook className="w-5 h-5" />
                <span className="sr-only">Facebook</span>
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                whileHover={shouldReduceMotion ? {} : { scale: 1.1, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              >
                <Twitter className="w-5 h-5" />
                <span className="sr-only">Twitter</span>
              </motion.a>
              <motion.a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                whileHover={shouldReduceMotion ? {} : { scale: 1.1, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              >
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </motion.a>
              <motion.a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                whileHover={shouldReduceMotion ? {} : { scale: 1.1, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              >
                <Linkedin className="w-5 h-5" />
                <span className="sr-only">Linkedin</span>
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.div 
          className="mt-12 pt-8 border-t border-border/60"
          variants={fadeUp}
        >
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} FinishMyWork. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </footer>
  )
}
