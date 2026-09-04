import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Loader2, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function SyncBadge({ online, syncing, pending }) {
  const { t } = useTranslation()
  const state = !online ? 'offline' : syncing ? 'syncing' : pending > 0 ? 'pending' : 'synced'

  const config = {
    offline: { icon: WifiOff, label: t('common.offlineOffline'), bg: 'bg-white/10 text-white/70' },
    syncing: { icon: Loader2, label: t('common.syncing'), bg: 'bg-turmeric/20 text-turmeric' },
    pending: { icon: null, label: t('common.pending', { count: pending }), bg: 'bg-turmeric/20 text-turmeric' },
    synced: { icon: CheckCircle2, label: t('common.synced'), bg: 'bg-white/10 text-white/70' },
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
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        )}
        {label}
      </motion.div>
    </AnimatePresence>
  )
}
