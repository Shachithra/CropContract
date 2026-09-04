import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'cc_install_dismissed'

export default function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    function handler(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    function onInstalled() {
      setIsInstalled(true)
      setVisible(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setVisible(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }, [])

  if (isInstalled || !visible) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 md:bottom-6 inset-x-0 z-50 px-4 md:px-6 md:max-w-md md:ml-auto md:mr-6"
        >
          <div className="bg-paddy text-white rounded-2xl shadow-raised p-4 flex items-center gap-3 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-turmeric grid place-items-center shrink-0">
              <Download size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm">{t('install.title', 'Install CropContract')}</p>
              <p className="text-[11px] text-white/60 mt-0.5">
                {t('install.description', 'Add to your home screen for quick access')}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg bg-turmeric text-paddy text-xs font-bold hover:brightness-110 active:scale-95 transition"
              >
                {t('install.button', 'Install')}
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 grid place-items-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
