import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react'
import Card from '../../components/common/Card.jsx'
import RiskBadge from '../../components/officer/RiskBadge.jsx'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">{t('officer.regionalOutbreaks')}</h1>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-paddy/10 text-paddy text-[11px] font-semibold">Week 04</span>
      </div>

      {/* Region list */}
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
                      {r.case_count} cases · {r.disease}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.trend === 'up' ? (
                      <span className="flex items-center gap-0.5 text-clay text-xs font-semibold">
                        <TrendingUp size={14} /> {r.trend_pct}%
                      </span>
                    ) : r.trend === 'down' ? (
                      <span className="flex items-center gap-0.5 text-teal text-xs font-semibold">
                        <TrendingDown size={14} /> {r.trend_pct}%
                      </span>
                    ) : null}
                    <RiskBadge level={r.risk_level} />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Risk legend */}
      <Card className="space-y-3">
        <p className="font-display font-bold text-sm text-paddy">Risk legend</p>
        <div className="flex flex-wrap gap-2">
          <RiskBadge level="low" />
          <RiskBadge level="moderate" />
          <RiskBadge level="high" />
          <RiskBadge level="critical" />
        </div>
      </Card>

      {/* Back to dashboard */}
      <button
        onClick={() => window.location.href = '/officer'}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}
