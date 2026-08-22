import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const STAGES = ['committed', 'growing', 'ready', 'harvested', 'delivered']

/** Vertical "crop journey" timeline for a farmer commitment. */
export default function GrowthThread({ progress = 2, title }) {
  const { t } = useTranslation()

  return (
    <div>
      {title && <p className="font-display font-bold text-sm mb-3">{title}</p>}
      <ol className="relative ml-1.5 border-l border-surface-border space-y-4">
        {STAGES.map((stage, i) => {
          const done = i < progress
          const current = i === progress
          return (
            <li key={stage} className="ml-5 relative">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full grid place-items-center ${
                  done ? 'bg-emerald' : current ? 'bg-gold shadow-glow' : 'bg-forest border border-surface-border'
                }`}
              >
                {done && <Check size={10} className="text-forest" strokeWidth={3.5} />}
              </motion.span>
              <p
                className={`text-sm font-semibold ${done || current ? 'text-textmain' : 'text-textmuted/50'}`}
              >
                {t(`journey.${stage}`)}
              </p>
              {current && <p className="text-[11px] text-gold">In progress…</p>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
