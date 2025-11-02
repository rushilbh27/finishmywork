"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from 'next-auth/react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState, useRef } from 'react'
import { fadeUp, staggerContainer, useReducedMotion } from '@/lib/motion'

export function CTASection() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const shouldReduceMotion = useReducedMotion()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const x = useTransform(mouseX, [0, 1], [-8, 8])
  const y = useTransform(mouseY, [0, 1], [-8, 8])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = (e.clientX - rect.left) / rect.width
    const relativeY = (e.clientY - rect.top) / rect.height
    
    mouseX.set(relativeX)
    mouseY.set(relativeY)
  }
  
  const handleMouseLeave = () => {
    if (shouldReduceMotion) return
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <motion.section 
      className="mx-auto max-w-5xl px-4 py-12 md:py-16"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div
        ref={containerRef}
        className="relative rounded-2xl p-8 md:p-12 glow overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--brand-blue) 7%, transparent), color-mix(in oklab, var(--brand-violet) 7%, transparent))",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        variants={fadeUp}
      >
        {/* Breathing gradient backdrop */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--brand-blue) 15%, transparent), transparent 70%)",
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          aria-hidden="true"
        />
        
        {/* Border overlay */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: "1px solid color-mix(in oklab, var(--brand-blue) 25%, transparent)",
          }}
          aria-hidden="true"
        />
        
        {/* Content with micro parallax */}
        <motion.div 
          className="relative flex flex-col items-center text-center gap-4"
          style={shouldReduceMotion ? {} : { x, y }}
        >
          <motion.h3 
            className="text-2xl md:text-3xl font-semibold"
            variants={fadeUp}
          >
            {isLoggedIn ? 'Start earning today' : 'Ready to get started?'}
          </motion.h3>
          <motion.p 
            className="text-muted-foreground max-w-2xl"
            variants={fadeUp}
          >
            {isLoggedIn 
              ? 'Post your first task or browse available opportunities.' 
              : 'Join thousands of students already earning on FinishMyWork.'
            }
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row items-center gap-3 mt-2"
            variants={fadeUp}
          >
            {isLoggedIn ? (
              <>
                <Link href="/tasks/new">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Button className="btn-gradient rounded-xl px-6 py-5 text-sm glow relative overflow-hidden group">
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative">Post a Task</span>
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/tasks">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Button variant="outline" className="btn-outline-gradient rounded-xl px-6 py-5 text-sm bg-transparent">
                      Browse Tasks
                    </Button>
                  </motion.div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Button className="btn-gradient rounded-xl px-6 py-5 text-sm glow relative overflow-hidden group">
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative">Sign Up</span>
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/tasks">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Button variant="outline" className="btn-outline-gradient rounded-xl px-6 py-5 text-sm bg-transparent">
                      Browse Tasks
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  )
}
