import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, AlertTriangle, DollarSign, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import FlaggedScanCard from '../../components/officer/FlaggedScanCard.jsx'
import RiskBadge from '../../components/officer/RiskBadge.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'

export default function OfficerReview() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['flagged-scans'],
    queryFn: async () => (await api.get('/scans/flagged')).data,
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await api.get('/alerts')).data,
  })

  const { data: priceRanges = [] } = useQuery({
    queryKey: ['price-ranges'],
    queryFn: async () => (await api.get('/price-ranges')).data,
  })

  const outbreakByRegion = useMemo(() => {
    const map = {}
    for (const s of scans) {
      const key = `${s.region}|${s.disease}`
      if (!map[key]) map[key] = { region: s.region, disease: s.disease, count: 0, severity: s.severity }
      map[key].count += 1
    }
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [scans])

  async function review(scanId, reviewBody) {
    try {
      await api.post(`/scans/${scanId}/review`, reviewBody)
      queryClient.invalidateQueries({ queryKey: ['flagged-scans'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      showToast(t('officer.confirmed'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  const highRiskRegions = useMemo(() => {
    const byRegion = {}
    for (const s of scans) {
      if (!byRegion[s.region]) byRegion[s.region] = { region: s.region, count: 0, severity: 'low' }
      byRegion[s.region].count += 1
      if (s.severity === 'critical') byRegion[s.region].severity = 'critical'
      else if (s.severity === 'high' && byRegion[s.region].severity !== 'critical') byRegion[s.region].severity = 'high'
      else if (s.severity === 'moderate' && byRegion[s.region].severity === 'low') byRegion[s.region].severity = 'moderate'
    }
    const total = scans.length || 1
    return Object.values(byRegion)
      .map((r) => ({ ...r, pct: Math.round((r.count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4)
  }, [scans])

  const recentFlagged = scans.filter((s) => s.review_status === 'pending').slice(0, 3)
  const criticalCount = scans.filter((s) => s.severity === 'critical').length
  const priceRangeCount = priceRanges.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-text-muted text-sm">{t('officer.regionalOverview')}</p>
          <h1 className="font-display text-2xl font-bold text-paddy">Officer {t('home.greeting', { name: 'W. Fernando' })}</h1>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-teal/15 text-teal text-[11px] font-semibold">{t('officer.agreementist')}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center py-4">
          <p className="font-display text-3xl font-bold text-paddy">{scans.length}</p>
          <p className="text-xs text-text-muted mt-1">{t('officer.flaggedCount')}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="font-display text-3xl font-bold text-turmeric">{alerts.length}</p>
          <p className="text-xs text-text-muted mt-1">{t('officer.activeAlerts')}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="font-display text-3xl font-bold text-clay">{criticalCount}</p>
          <p className="text-xs text-text-muted mt-1">Critical Cases</p>
        </Card>
        <Card className="text-center py-4">
          <p className="font-display text-3xl font-bold text-teal">{priceRangeCount}</p>
          <p className="text-xs text-text-muted mt-1">Price Ranges</p>
        </Card>
      </div>

      {/* High-risk regions */}
      {highRiskRegions.length > 0 && (
        <Card className="space-y-3">
          <p className="font-display font-bold text-sm text-paddy flex items-center gap-2">
            <AlertTriangle size={15} className="text-clay" /> {t('officer.highRiskRegions')}
          </p>
          <div className="space-y-3">
            {highRiskRegions.map((r) => (
              <div key={r.region} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-paddy">{t(`regions.${r.region}`, { defaultValue: r.region })}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-paddy">{r.pct}%</span>
                    <RiskBadge level={r.severity} />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${
                      r.severity === 'critical' ? 'bg-clay' :
                      r.severity === 'high' ? 'bg-clay/70' :
                      r.severity === 'moderate' ? 'bg-turmeric' : 'bg-teal'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recently flagged */}
      <div className="space-y-3">
        <p className="font-display font-bold text-sm text-paddy">{t('officer.recentlyFlagged')}</p>
        {recentFlagged.length === 0 ? (
          <Card className="text-center py-8">
            <ShieldAlert size={28} className="mx-auto mb-2 text-paddy/30" />
            <p className="text-text-muted text-sm">{t('officer.empty')}</p>
          </Card>
        ) : (
          recentFlagged.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <FlaggedScanCard scan={s} onReview={review} compact />
            </motion.div>
          ))
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/officer/outbreaks" className="block">
          <button className="btn-turmeric w-full !rounded-xl !py-3">
            {t('officer.viewRegionalOutbreaks')}
          </button>
        </Link>
        <Link to="/officer/warnings" className="block">
          <button className="w-full rounded-xl px-4 py-3 font-display font-semibold text-sm text-paddy border border-paddy/30 hover:bg-paddy/5 active:scale-[0.98] transition">
            <Users size={16} className="inline mr-2" />
            Warnings
          </button>
        </Link>
      </div>

      <Link to="/officer/price-ranges" className="block">
        <button className="w-full rounded-xl px-4 py-3 font-display font-semibold text-sm text-paddy border border-paddy/30 hover:bg-paddy/5 active:scale-[0.98] transition">
          <DollarSign size={16} className="inline mr-2" />
          Manage Price Ranges
        </button>
      </Link>
    </div>
  )
}
