import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function BanCountdown({ bannedUntil }) {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!bannedUntil) return

    function calc() {
      const end = new Date(bannedUntil).getTime()
      const now = Date.now()
      const diff = Math.max(0, end - now)

      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [bannedUntil])

  return (
    <div className="flex items-center justify-center gap-3 text-center">
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center">
          <span className="font-display text-4xl font-bold text-clay">{timeLeft.days}</span>
          <span className="text-xs text-text-muted mt-1">{t('ban.days', { count: timeLeft.days })}</span>
        </div>
      )}
      {timeLeft.days > 0 && <span className="font-display text-2xl text-clay/40">:</span>}
      <div className="flex flex-col items-center">
        <span className="font-display text-4xl font-bold text-clay">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-xs text-text-muted mt-1">{t('ban.hours', { count: timeLeft.hours })}</span>
      </div>
      <span className="font-display text-2xl text-clay/40">:</span>
      <div className="flex flex-col items-center">
        <span className="font-display text-4xl font-bold text-clay">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-xs text-text-muted mt-1">{t('ban.minutes', { count: timeLeft.minutes })}</span>
      </div>
      <span className="font-display text-2xl text-clay/40">:</span>
      <div className="flex flex-col items-center">
        <span className="font-display text-4xl font-bold text-clay">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-xs text-text-muted mt-1">{t('ban.seconds', { count: timeLeft.seconds })}</span>
      </div>
    </div>
  )
}
