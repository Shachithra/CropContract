import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff, RefreshCw, Wifi } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOfflineSync } from '../../hooks/useOfflineSync.js'

/** Floating connectivity pill — mint when online, gold when offline. */
export default function OfflineBanner() {
  const { t } = useTranslation()
  const { online, pending, syncing } = useOfflineSync()

  const state = !online ? 'offline' : syncing ? 'syncing' : pending > 0 ? 'pending' : 'online'
  const visible = state !== 'online' || pending > 0

  const config = {
    offline: { icon: CloudOff, cls: 'bg-gold/15 border-gold/50 text-gold', label: t('common.offline') },
    syncing: { icon: RefreshCw, cls: 'bg-emerald/15 border-emerald/50 text-mint', label: t('common.syncing') },
    pending: {
      icon: RefreshCw,
      cls: 'bg-gold/15 border-gold/50 text-gold',
      label: t('common.pendingSync', { count: pending }),
    },
    online: { icon: Wifi, cls: 'bg-mint/15 border-mint/50 text-mint', label: t('common.online') },
  }[state]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur text-xs font-semibold ${config.cls}`}
        >
          <config.icon size={14} className={syncing ? 'animate-spin' : ''} />
          {config.label}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
