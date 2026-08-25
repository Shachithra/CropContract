import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import { useContracts } from '../../hooks/useContracts.js'

export default function Marketplace() {
  const { t } = useTranslation()
  const { data: contracts = [], isLoading } = useContracts()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.marketplace')}</h1>
        <p className="text-text-muted text-sm mt-0.5">{t('contract.openContracts')}</p>
      </div>

      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : contracts.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">{t('common.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((c, i) => {
            const pct = Math.round((c.committed_kg / Math.max(c.total_kg, 1)) * 100)
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/marketplace/${c.id}`}>
                  <Card hoverable className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-paddy">{c.crop_type}</p>
                        <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                          <span className="font-semibold text-turmeric">Rs. {c.price_per_kg}</span>{t('contract.perKg')}
                          <span className="text-surface-border">·</span>
                          <MapPin size={11} />
                          {t(`regions.${c.region}`, { defaultValue: c.region })}
                        </p>
                      </div>
                      <Chip tone={c.status}>{t(`contract.status.${c.status}`)}</Chip>
                    </div>

                    <ProgressBar value={c.committed_kg} max={c.total_kg} />

                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>{c.committed_kg.toLocaleString()} / {c.total_kg.toLocaleString()} kg</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {c.delivery_date || '—'}
                      </span>
                    </div>

                    {c.buyer_name && (
                      <p className="text-[11px] text-text-muted">Buyer: {c.buyer_name}</p>
                    )}
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
