import { motion } from 'framer-motion'

export default function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.015 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`card-surface p-4 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
