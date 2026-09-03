import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import Button from '../common/Button.jsx'

export default function OverCommitRecovery({ error, onReduce, onViewSimilar }) {
  const { t } = useTranslation()
  if (!error) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <div className="max-w-lg mx-auto bg-white border border-surface-border rounded-2xl shadow-raised p-5 space-y-4">
        <div>
          <p className="font-display font-bold text-paddy">{t('contract.queuedOffline')}</p>
          <p className="text-sm text-text-muted mt-1">{error.detail}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onReduce} className="flex-1">
            {t('contract.remaining', { kg: error.remaining_kg })}
          </Button>
          <Button variant="outline" onClick={onViewSimilar} className="flex-1">
            {t('contract.openContracts')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
