"use client"

import { motion, easeInOut } from "framer-motion"
import { BookOpen, Coins, Shield } from "lucide-react"
import { useReducedMotion, spring, viewportOnce } from "@/lib/motion"
import { useState, useRef, useEffect } from "react"

const features = [
  {
    icon: BookOpen,
    title: "Post and find academic help.",
    desc: "Discover peers for assignments, tutoring, and study partners.",
  },
  {
    icon: Coins,
    title: "Earn by sharing your expertise.",
    desc: "Offer your skills and get paid for quality support.",
  },
  {
    icon: Shield,
    title: "Safe, transparent payments.",
    desc: "Clear expectations, secure transactions, fair reviews.",
  },
]

function FeatureCard({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) {
  const prefersReducedMotion = useReducedMotion()
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current || isMobile) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (e.clientX - centerX) / (rect.width / 2)
    const deltaY = (e.clientY - centerY) / (rect.height / 2)
    setRotateX(deltaY * -4)
    setRotateY(deltaX * 4)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setIsHovered(false)
  }

  // On mobile, cards gently float up and down and have a dynamic animated glow
  const mobileAnimation = isMobile && !prefersReducedMotion ? {
    animate: { y: [0, -8, 0, 8, 0], boxShadow: [
      '0 0 24px 4px rgba(139,92,246,0.18)',
      '0 0 36px 8px rgba(139,92,246,0.32)',
      '0 0 24px 4px rgba(139,92,246,0.18)'
    ] },
    transition: { duration: 4 + index, repeat: Infinity, ease: easeInOut }
  } : {}

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ ...spring, delay: index * 0.06 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transform: prefersReducedMotion || isMobile ? undefined : `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      }}
  className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/85 backdrop-blur-2xl shadow-card p-6 md:p-7 will-change-transform transition-all duration-300 hover:shadow-2xl hover:border-purple-500/30 group cursor-pointer"
      {...mobileAnimation}
    >
      {/* Purple backlight glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.15), transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={isHovered ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Shine effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: isHovered ? '100%' : '-100%', opacity: isHovered ? 0.3 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          }}
        />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div
          className="rounded-xl p-2.5 transition-all duration-300 group-hover:scale-110"
          style={{ background: "linear-gradient(90deg, var(--brand-blue), var(--brand-violet))" }}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-medium transition-colors duration-300 group-hover:text-purple-400">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  )
}
