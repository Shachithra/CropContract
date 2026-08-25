import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export default function CountUp({ value, duration = 800, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  const numericValue = typeof value === 'number'
    ? value
    : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0

  useEffect(() => {
    if (!isInView) return
    if (numericValue === 0) { setDisplay(0); return }

    let start = 0
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * numericValue))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, numericValue, duration])

  const nonNumeric = String(value).replace(/[0-9,]/g, '')

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toLocaleString()}{suffix || nonNumeric}
    </span>
  )
}
