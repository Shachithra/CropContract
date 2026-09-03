import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOfflineSync } from '../../hooks/useOfflineSync.js'

export default function OfflineBanner() {
  const { t } = useTranslation()
  const { online } = useOfflineSync()
  if (online) return null

  return (
    <div className="fixed top-14 inset-x-0 z-20 bg-turmeric/90 text-white text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-2">
      <WifiOff size={13} />
      {t('common.offlineOffline')}
    </div>
  )
}
