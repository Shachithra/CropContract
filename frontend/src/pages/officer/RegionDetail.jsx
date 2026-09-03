import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Card from '../../components/common/Card.jsx'
import RiskBadge from '../../components/officer/RiskBadge.jsx'
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
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-paddy">{t(`regions.${region}`, { defaultValue: region })}</h1>
        {outbreak?.risk_level && <RiskBadge level={outbreak.risk_level} />}
      </div>

      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : !outbreak ? (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">{t('officer.empty')}</p>
        </Card>
      ) : (
        <>
          {/* Cases per week chart */}
          {chartData.length > 0 && (
            <Card className="space-y-3">
              <p className="font-display font-bold text-sm text-paddy">Cases per week</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B6558' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B6558' }} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #D4C9B0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="cases" fill="#B5533C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Flagged cases driving this */}
          {outbreak.recent_scans && outbreak.recent_scans.length > 0 && (
            <Card className="space-y-3">
              <p className="font-display font-bold text-sm text-paddy">Flagged cases driving this</p>
              <div className="space-y-2">
                {outbreak.recent_scans.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-cream border border-surface-border rounded-xl px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-paddy truncate">{s.crop_type || 'Crop'} - {s.disease}</p>
                      <p className="text-[11px] text-text-muted">{s.farmer_name} · {s.confidence ? `${Math.round(s.confidence * 100)}%` : ''} · {s.scanned_at || ''}</p>
                    </div>
                    <RiskBadge level={s.severity || 'moderate'} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Issue alert button */}
          <button
            onClick={() => navigate('/officer/alert')}
            className="w-full rounded-xl px-4 py-3 font-display font-semibold text-sm text-white bg-turmeric hover:brightness-110 active:scale-[0.98] transition"
          >
            Issue Alert for This Region
          </button>
        </>
      )}

      {/* Back to outbreaks */}
      <button
        onClick={() => navigate('/officer/outbreaks')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Outbreaks
      </button>
    </div>
  )
}
