import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function SyncBadge({ online, syncing, pending }) {
  const state = !online ? 'offline' : syncing ? 'syncing' : pending > 0 ? 'pending' : 'synced'

  const config = {
    offline: { icon: WifiOff, label: 'Offline', bg: 'bg-surface-border/60 text-text-muted' },
    syncing: { icon: Loader2, label: 'Syncing…', bg: 'bg-turmeric/15 text-turmeric' },
    pending: { icon: null, label: `${pending} pending`, bg: 'bg-turmeric/15 text-turmeric' },
    synced: { icon: CheckCircle2, label: 'Synced', bg: 'bg-teal/15 text-teal' },
  }

  const { icon: Icon, label, bg } = config[state]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${bg}`}
      >
        {Icon && (
          <Icon
            size={12}
            className={state === 'syncing' ? 'animate-spin' : ''}
          />
        )}
        {state === 'pending' && (
          <span className="w-1.5 h-1.5 rounded-full bg-turmeric animate-pulse" />
        )}
        {label}
      </motion.div>
    </AnimatePresence>
  )
}
