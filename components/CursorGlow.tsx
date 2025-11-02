'use client'


import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useMotionTemplate, useAnimation } from 'framer-motion'
import { useReducedMotion } from '@/lib/motion'

export function CursorGlow() {
  const shouldReduceMotion = useReducedMotion()
  const [isHovering, setIsHovering] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Mouse position values
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring animation for cursor following (elegant easing)
  const springConfig = { damping: 30, stiffness: 120 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  // Dynamic opacity based on hover state (stronger)
  const opacity = isHovering ? 1.4 : 0.4

  // Detect mobile device
useEffect(() => {
  if (typeof window === "undefined") return; // Prevent crash on SSR/mobile hydration

  const handleMouse = (e: MouseEvent) => {
    // your existing code
  };

  window.addEventListener("mousemove", handleMouse);
  return () => window.removeEventListener("mousemove", handleMouse);
}, []);


  // Animate the glow on mobile
  const controls = useAnimation()
  useEffect(() => {
    if (shouldReduceMotion) return
    if (isMobile) {
      controls.start({
        x: [100, window.innerWidth - 100, window.innerWidth / 2],
        y: [200, window.innerHeight - 200, window.innerHeight / 2],
        transition: {
          duration: 10,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      })
    } else {
      let frameId: number | null = null;
      let lastX = 0;
      let lastY = 0;
      let lastInteractive = false;
      const update = () => {
        mouseX.set(lastX)
        mouseY.set(lastY)
        setIsHovering(lastInteractive)
        frameId = null;
      };
      const handleMouseMove = (e: MouseEvent) => {
        lastX = e.clientX;
        lastY = e.clientY;
        const target = e.target as HTMLElement;
        lastInteractive = !!target.closest('button, a, .group, [role="button"]');
        if (frameId === null) {
          frameId = requestAnimationFrame(update);
        }
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }
  }, [mouseX, mouseY, shouldReduceMotion, isMobile, controls])

  if (shouldReduceMotion) return null

  // On mobile, animate the glow in a floating pattern
  if (isMobile) {
    return (
      <motion.div
        className="pointer-events-none fixed inset-0 z-[1]"
        animate={controls}
        style={{
          background: 'radial-gradient(120px circle at var(--x, 50vw) var(--y, 50vh), rgba(255,255,255,0.4), transparent 60%)',
          mixBlendMode: 'soft-light',
          transition: 'opacity 0.3s ease',
        }}
        aria-hidden="true"
      />
    )
  }

  // On desktop, follow the cursor
  const background = useMotionTemplate`radial-gradient(120px circle at ${x}px ${y}px, rgba(255, 255, 255, ${opacity}), transparent 60%)`
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background,
        mixBlendMode: 'soft-light',
        transition: 'opacity 0.3s ease',
      }}
      aria-hidden="true"
    />
  )
}
