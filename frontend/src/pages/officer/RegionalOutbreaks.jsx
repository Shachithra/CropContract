import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import RiskBadge from '../../components/officer/RiskBadge.jsx'
import OutbreakTrendChart from '../../components/officer/OutbreakTrendChart.jsx'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api.js'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'

export default function RegionalOutbreaks() {
  const { t } = useTranslation()

  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['outbreaks'],
    queryFn: async () => {
      const results = []
      for (const region of SRI_LANKA_DISTRICTS.slice(0, 10)) {
        try {
          const { data } = await api.get(`/outbreaks/region/${encodeURIComponent(region)}`)
          if (data.case_count > 0) results.push({ ...data, region })
        } catch { /* skip */ }
      }
      return results
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t('officer.regionalOutbreaks')}</h1>
        <p className="text-text-muted text-sm mt-0.5">{t('officer.outbreakWatch')}</p>
      </div>

      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : regions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">{t('officer.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {regions.map((r, i) => (
            <motion.div
              key={r.region}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/officer/outbreaks/${encodeURIComponent(r.region)}`}>
                <Card hoverable className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-paddy">{t(`regions.${r.region}`, { defaultValue: r.region })}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {r.case_count} {t('officer.cases')} · {r.disease}
                    </p>
                  </div>
                  <RiskBadge level={r.risk_level} />
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
