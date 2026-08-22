import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, value, label, tone = 'emerald', delay = 0 }) {
  const toneCls = {
    emerald: 'text-emerald bg-emerald/10',
    mint: 'text-mint bg-mint/10',
    gold: 'text-gold bg-gold/10',
    red: 'text-alert bg-alert/10',
  }[tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="card-surface p-4 flex items-center gap-3"
    >
      {Icon && (
        <span className={`w-10 h-10 rounded-xl grid place-items-center ${toneCls}`}>
          <Icon size={19} />
        </span>
      )}
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-tight truncate">{value}</p>
        <p className="text-[11px] text-textmuted truncate">{label}</p>
      </div>
    </motion.div>
  )
}
