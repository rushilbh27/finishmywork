import { Variants, Transition } from 'framer-motion'
import { useEffect, useState } from 'react'

// Reusable spring configuration for smooth, premium animations
export const spring: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 22,
}

// Smooth ease-out spring for entrance animations
export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 20,
}

// Fade up animation variants
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: spring,
  },
}

// Fade in animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: { duration: 0.4 },
  },
}

// Stagger container configuration
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

// Fast stagger for hero elements
export const fastStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

// Hook to detect reduced motion preference
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Viewport animation settings for scroll-triggered animations
export const viewportOnce = {
  once: true,
  amount: 0.3,
}

export const viewportRepeat = {
  once: false,
  amount: 0.3,
}

// Tilt calculation helper
export function calculateTilt(x: number, y: number, rect: DOMRect) {
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const deltaX = (x - centerX) / (rect.width / 2)
  const deltaY = (y - centerY) / (rect.height / 2)
  
  return {
    rotateX: deltaY * -4, // -4 to 4 degrees
    rotateY: deltaX * 4,
  }
}
