import * as React from 'react'
import { motion, useAnimation } from 'framer-motion'

export function MetricAnimate({ value, className }: { value: number; className?: string }) {
  const controls = useAnimation()
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    controls.start({
      x: [0, 0],
      opacity: [0.5, 1],
      transition: { duration: 0.6, ease: 'easeOut' },
    })
    const start = 0
    const end = value
    if (end === 0) {
      setDisplay(0)
      return
    }
    const duration = 800
    const step = Math.max(1, Math.floor(end / 40))
    let current = start
    const interval = setInterval(() => {
      current += step
      if (current >= end) {
        setDisplay(end)
        clearInterval(interval)
      } else {
        setDisplay(current)
      }
    }, duration / (end / step))
    return () => clearInterval(interval)
  }, [value, controls])

  return (
    <motion.span animate={controls} className={className}>
      {display}
    </motion.span>
  )
}
