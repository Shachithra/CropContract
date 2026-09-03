import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const STAGES = ['contracted', 'committed', 'growing', 'ready', 'delivered']

export default function GrowthThread({ progress = 0, title }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      {title && <p className="font-display font-bold text-sm text-paddy">{title}</p>}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex-1 flex items-center gap-1">
            <div className="relative flex-1">
              <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i <= progress ? '100%' : '0%' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`h-full rounded-full ${
                    i < progress ? 'bg-turmeric' : i === progress ? 'bg-paddy' : 'bg-surface-border'
                  }`}
                />
              </div>
            </div>
            {i === progress && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-3 h-3 rounded-full bg-paddy border-2 border-white shadow-sm shrink-0"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-text-muted font-medium">
        {STAGES.map((s, i) => (
          <span key={s} className={i <= progress ? 'text-paddy font-semibold' : ''}>
            {t(`journey.${s}`, { defaultValue: s.charAt(0).toUpperCase() + s.slice(1) })}
          </span>
        ))}
      </div>
    </div>
  )
}
