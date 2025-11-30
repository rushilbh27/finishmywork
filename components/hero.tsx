"use client"

import Link from "next/link"
import { motion, useMotionValue, useTransform, useScroll } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useSession } from 'next-auth/react'
import { useReducedMotion, fastStagger, fadeUp } from "@/lib/motion"
import { useEffect, useRef, useState } from "react"

export function Hero() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Mouse tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Scroll tracking
  const { scrollY } = useScroll()
  
  // Parallax transforms for different depth layers
  const y1 = useTransform(scrollY, [0, 500], [0, -40])
  const y2 = useTransform(scrollY, [0, 500], [0, -80])
  const y3 = useTransform(scrollY, [0, 500], [0, -120])
  
  // Mouse parallax transforms
  const x1 = useTransform(mouseX, [0, 1000], [-10, 10])
  const x2 = useTransform(mouseX, [0, 1000], [-20, 20])
  const x3 = useTransform(mouseX, [0, 1000], [-40, 40])
  
  useEffect(() => {
    if (prefersReducedMotion) return
    
    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY, prefersReducedMotion])

  return (
    <section ref={containerRef} className="relative isolate overflow-hidden min-h-[68vh] flex items-center">
      {/* Parallax Background Layers */}
      {!prefersReducedMotion && (
        <>
          {/* Layer 1 - Deepest */}
          <motion.div
            className="absolute inset-0 pointer-events-none will-change-transform"
            style={{ x: x1, y: y1 }}
          >
            <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          </motion.div>
          
          {/* Layer 2 - Middle */}
          <motion.div
            className="absolute inset-0 pointer-events-none will-change-transform"
            style={{ x: x2, y: y2 }}
          >
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          </motion.div>
          
          {/* Layer 3 - Foreground */}
          <motion.div
            className="absolute inset-0 pointer-events-none will-change-transform"
            style={{ x: x3, y: y3 }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl" />
          </motion.div>
          
          {/* Cursor Reactive Glow */}
          <motion.div
            className="absolute pointer-events-none will-change-transform mix-blend-overlay"
            style={{
              left: mouseX,
              top: mouseY,
              x: '-50%',
              y: '-50%',
            }}
          >
            <div className="w-96 h-96 bg-gradient-radial from-purple-400/30 via-purple-500/10 to-transparent rounded-full blur-2xl" />
          </motion.div>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-12 md:pt-28 md:pb-20">
        <motion.div
          className="flex flex-col items-center text-center gap-6"
          initial="hidden"
          animate="show"
          variants={prefersReducedMotion ? undefined : fastStagger}
        >
          <motion.h1
            className="text-pretty text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight tracking-tight"
            variants={prefersReducedMotion ? undefined : fadeUp}
          >
            <span className="gradient-text">Connect. Learn. Earn.</span>
          </motion.h1>
          <motion.p
            className="max-w-2xl text-balance text-base md:text-lg text-muted-foreground"
            variants={prefersReducedMotion ? undefined : fadeUp}
          >
            Exchange skills, complete tasks, and grow together — all in one place.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-3 mt-2"
            variants={prefersReducedMotion ? undefined : fadeUp}
          >
            {isLoggedIn ? (
              <>
                <Link href="/tasks/new">
                  <Button className="relative overflow-hidden group btn-gradient rounded-xl px-8 py-5 text-sm glow before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 before:ease-in-out">
                    Post a Task
                  </Button>
                </Link>
                <Link href="/tasks">
                  <Button variant="outline" className="btn-outline-gradient rounded-xl px-8 py-5 text-sm bg-transparent">
                    Browse Tasks
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button className="relative overflow-hidden group btn-gradient rounded-xl px-8 py-5 text-sm glow before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 before:ease-in-out">
                    Sign Up
                  </Button>
                </Link>
                <Link href="/tasks">
                  <Button variant="outline" className="btn-outline-gradient rounded-xl px-8 py-5 text-sm bg-transparent">
                    Browse Tasks
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
