import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Card from '../../components/common/Card.jsx'
import RiskBadge from '../../components/officer/RiskBadge.jsx'
import OutbreakTrendChart from '../../components/officer/OutbreakTrendChart.jsx'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api.js'

export default function RegionDetail() {
  const { t } = useTranslation()
  const { region } = useParams()
  const navigate = useNavigate()

  const { data: outbreak, isLoading } = useQuery({
    queryKey: ['outbreak', region],
    queryFn: async () => (await api.get(`/outbreaks/region/${encodeURIComponent(region)}`)).data,
    enabled: !!region,
  })

  const chartData = outbreak?.cases_by_week
    ? Object.entries(outbreak.cases_by_week).map(([week, cases]) => ({ week, cases }))
    : []

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t(`regions.${region}`, { defaultValue: region })}</h1>
        <p className="text-text-muted text-sm mt-0.5">{t('officer.regionDetail')}</p>
      </div>

      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : !outbreak ? (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">{t('officer.empty')}</p>
        </Card>
      ) : (
        <>
          <Card className="grid grid-cols-2 gap-4">
            <div>
              <p className="label-muted">{t('officer.riskLevel')}</p>
              <RiskBadge level={outbreak.risk_level} />
            </div>
            <div>
              <p className="label-muted">{t('officer.trend')}</p>
              <p className="font-display font-bold text-paddy">
                {outbreak.trend === 'up' ? '↑' : outbreak.trend === 'down' ? '↓' : '→'} {outbreak.trend_pct}%
              </p>
            </div>
            <div>
              <p className="label-muted">{t('officer.cases')}</p>
              <p className="font-display font-bold text-2xl text-paddy">{outbreak.case_count}</p>
            </div>
            <div>
              <p className="label-muted">Disease</p>
              <p className="font-medium text-paddy">{outbreak.disease}</p>
            </div>
          </Card>

          <OutbreakTrendChart data={chartData} />
        </>
      )}
    </div>
  )
}
