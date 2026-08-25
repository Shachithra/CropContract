import { motion } from 'framer-motion'

export default function ProgressBar({ value, max = 100, className = '' }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))
  return (
    <div className={`h-2 rounded-full bg-surface overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        className="h-full rounded-full bg-turmeric"
      />
    </div>
  )
}
