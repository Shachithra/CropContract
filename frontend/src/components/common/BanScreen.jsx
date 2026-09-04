import { useTranslation } from 'react-i18next'
import { Ban, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import BanCountdown from './BanCountdown.jsx'

export default function BanScreen({ banInfo }) {
  const { t } = useTranslation()
  const isPermanent = banInfo?.ban_type === 'permanent'

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 rounded-full bg-clay/15 grid place-items-center mb-6"
      >
        <Ban size={48} className="text-clay" />
      </motion.div>

      <h1 className="font-display text-2xl font-bold text-clay mb-2">
        {isPermanent ? t('ban.permBan') : t('ban.tempBan')}
      </h1>

      {banInfo?.reason && (
        <p className="text-sm text-text-muted mb-4">{t('ban.banReason', { reason: banInfo.reason })}</p>
      )}

      {!isPermanent && banInfo?.banned_until && (
        <div className="space-y-4 mb-6">
          <p className="text-sm text-text-muted">{t('ban.timeRemaining')}</p>
          <BanCountdown bannedUntil={banInfo.banned_until} />
        </div>
      )}

      {isPermanent && (
        <div className="bg-clay/10 border border-clay/20 rounded-xl px-4 py-3 mb-6 max-w-sm">
          <p className="text-sm text-clay">{t('ban.permanentlyBanned')}</p>
        </div>
      )}

      <div className="space-y-3 w-full max-w-xs">
        <div className="flex items-center gap-2 text-sm text-text-muted justify-center">
          <Phone size={14} />
          <span>{t('ban.contactSupport')}</span>
        </div>
      </div>
    </div>
  )
}
