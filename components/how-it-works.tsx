"use client"

import { motion, useScroll, useTransform, easeInOut } from "framer-motion"
import { useReducedMotion, viewportOnce } from "@/lib/motion"
import { useRef, useEffect, useState } from "react"

const steps = [
  { title: "Sign Up", desc: "Create your FinishMyWork profile in seconds." },
  { title: "Post/Browse", desc: "List tasks or find ones that match your skills." },
  { title: "Connect", desc: "Chat, clarify scope, and get aligned quickly." },
  { title: "Earn", desc: "Deliver quality work and get paid securely." },
]

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  })
  
  const progressHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches)
    }
  }, [])

  return (
    <section id="how-it-works" ref={containerRef} className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
      {/* Progress Rail */}
      {!prefersReducedMotion && (
        <div className="absolute left-8 top-24 bottom-24 w-0.5 bg-border/40 hidden lg:block">
          <motion.div
            className="w-full bg-gradient-to-b from-purple-500 to-cyan-500"
            style={{ height: progressHeight }}
          />
        </div>
      )}
      
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => {
          // On mobile, cards gently float up and down
          const mobileAnimation = isMobile && !prefersReducedMotion ? {
            animate: { y: [0, -8, 0, 8, 0], boxShadow: [
              '0 0 24px 4px rgba(139,92,246,0.18)',
              '0 0 36px 8px rgba(139,92,246,0.32)',
              '0 0 24px 4px rgba(139,92,246,0.18)'
            ] },
            transition: { duration: 4 + i, repeat: Infinity, ease: easeInOut }
          } : {}
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 22,
                delay: i * 0.08,
              }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.03, y: -4 }}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/85 backdrop-blur-2xl shadow-card p-6 will-change-transform transition-all duration-300 hover:shadow-2xl hover:border-purple-500/30 group cursor-pointer"
              {...mobileAnimation}
            >
              {/* Purple backlight glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.15), transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              {/* Floating icon background */}
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute -top-4 -right-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />
                </motion.div>
              )}

              <div className="flex items-center gap-3 relative z-10">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-sm font-semibold transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "linear-gradient(90deg, var(--brand-blue), var(--brand-violet))",
                    color: "var(--primary-foreground)",
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <h4 className="font-medium transition-colors duration-300 group-hover:text-purple-400">{s.title}</h4>
              </div>
              <p className="mt-3 text-sm text-muted-foreground relative z-10">{s.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
