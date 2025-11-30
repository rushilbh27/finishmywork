'use client'

import { useRef, useEffect, useCallback, useState, ReactNode } from 'react'
import { gsap } from 'gsap'

const DEFAULT_PARTICLE_COUNT = 12
const DEFAULT_GLOW_COLOR = '139, 92, 246'

const createParticleElement = (x: number, y: number, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div')
  el.className = 'particle'
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `
  return el
}

interface MagicCardProps {
  title?: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
  className?: string
  enableParticles?: boolean
  enableTilt?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  particleCount?: number
  glowColor?: string
}

export default function MagicCard({ 
  title, 
  description, 
  icon, 
  children,
  className = '',
  enableParticles = true,
  enableTilt = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const [isHovered, setIsHovered] = useState(false)

  // Particle animation
  const animateParticles = useCallback(() => {
    if (!cardRef.current || !enableParticles || !isHovered) return

    const rect = cardRef.current.getBoundingClientRect()
    
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        if (!isHovered || !cardRef.current) return

        const particle = createParticleElement(
          Math.random() * rect.width,
          Math.random() * rect.height,
          glowColor
        )

        cardRef.current.appendChild(particle)
        particlesRef.current.push(particle)

        gsap.fromTo(particle,
          { 
            scale: 0, 
            opacity: 1,
            x: 0,
            y: 0
          },
          {
            scale: 1,
            opacity: 0,
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            duration: 1.5,
            ease: 'power2.out',
            onComplete: () => {
              particle.remove()
              particlesRef.current = particlesRef.current.filter(p => p !== particle)
            }
          }
        )
      }, i * 150)
    }
  }, [isHovered, enableParticles, particleCount, glowColor])

  useEffect(() => {
    if (isHovered) {
      animateParticles()
    }
  }, [isHovered, animateParticles])

  // Tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const deltaX = (x - centerX) / centerX
    const deltaY = (y - centerY) / centerY

    if (enableTilt) {
      gsap.to(cardRef.current, {
        rotateY: deltaX * 5,
        rotateX: -deltaY * 5,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    if (enableBorderGlow) {
      const relativeX = (x / rect.width) * 100
      const relativeY = (y / rect.height) * 100
      cardRef.current.style.setProperty('--glow-x', `${relativeX}%`)
      cardRef.current.style.setProperty('--glow-y', `${relativeY}%`)
      cardRef.current.style.setProperty('--glow-intensity', '1')
    }
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    
    setIsHovered(false)

    if (enableTilt) {
      gsap.to(cardRef.current, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.5,
        ease: 'power2.out'
      })
    }

    if (enableBorderGlow) {
      cardRef.current.style.setProperty('--glow-intensity', '0')
    }

    // Clear particles
    particlesRef.current.forEach(particle => particle.remove())
    particlesRef.current = []
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`
        magic-card relative overflow-hidden
        bg-gradient-to-br from-[#0b0f19] to-[#0a0d16] 
        border border-white/10 rounded-2xl p-6 md:p-8
        transition-all duration-300
        hover:shadow-xl hover:shadow-purple-500/20
        ${enableBorderGlow ? 'magic-card--border-glow' : ''}
        ${className}
      `}
      style={{
        '--glow-x': '50%',
        '--glow-y': '50%',
        '--glow-intensity': '0',
        '--glow-color': glowColor,
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      } as React.CSSProperties & {
        '--glow-x': string
        '--glow-y': string
        '--glow-intensity': string
        '--glow-color': string
      }}
    >
      {/* Spotlight effect */}
      {enableSpotlight && (
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 300px at var(--glow-x, 50%) var(--glow-y, 50%), rgba(${glowColor}, 0.1), transparent)`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Icon */}
      {icon && (
        <div className="mb-4 flex justify-center md:justify-start">
          {icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-slate-300 text-sm md:text-base leading-relaxed">
          {description}
        </p>
      )}

      {/* Custom children */}
      {children}
    </div>
  )
}
