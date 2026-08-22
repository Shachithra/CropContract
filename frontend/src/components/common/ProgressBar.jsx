import { motion } from 'framer-motion'

/** Emerald→mint gradient quota progress bar. */
export default function ProgressBar({ value, max = 100, className = '' }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))
  return (
    <div className={`h-2 rounded-full bg-forest overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        className="h-full rounded-full bg-emerald-mint"
      />
    </div>
  )
}
