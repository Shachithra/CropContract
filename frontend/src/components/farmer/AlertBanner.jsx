import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AlertBanner({ alert, onDismiss }) {
  const { t } = useTranslation()
  if (!alert) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-clay shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-clay">
            {t('home.regionalAlert')} · {alert.disease}
          </p>
          <p className="text-xs text-paddy/80 mt-0.5 line-clamp-2">{alert.message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-text-muted hover:text-paddy text-xs shrink-0">
            ×
          </button>
        )}
      </div>
    </motion.div>
  )
}
