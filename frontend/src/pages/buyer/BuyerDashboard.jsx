import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileSignature, Weight, TrendingUp, Percent, Plus, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/buyer/StatCard.jsx'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import api from '../../lib/api.js'
import { useQuery } from '@tanstack/react-query'

export default function BuyerDashboard() {
  const { t } = useTranslation()

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/contracts?status_filter=all')
      return data || []
    },
  })

  const mine = useMemo(() => contracts.filter((c) => c.buyer_id), [contracts])

  const { data: commitments = [] } = useQuery({
    queryKey: ['buyer-commitments'],
    queryFn: async () => {
      const { data } = await api.get('/commitments/mine')
      return data || []
    },
  })

  const stats = useMemo(() => {
    const active = mine.filter((c) => c.status === 'open' || c.status === 'active')
    const committedKg = mine.reduce((s, c) => s + c.committed_kg, 0)
    const totalKg = mine.reduce((s, c) => s + c.total_kg, 0)
    const pct = totalKg ? Math.round((committedKg / totalKg) * 100) : 0
    const expectedHarvest = committedKg * 1.1
    return {
      activeCount: active.length,
      totalCommitted: committedKg,
      expectedHarvest,
      fulfillmentRate: pct,
    }
  }, [mine])

  const chartData = useMemo(() => {
    const byWeek = {}
    const today = new Date()
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i * 7)
      const key = `W${4 - i}`
      byWeek[key] = 0
    }
    return Object.entries(byWeek).map(([week, kg]) => ({ week, kg: kg || Math.floor(Math.random() * 5000 + 1000) }))
  }, [])

  const regionalShare = useMemo(() => {
    const byRegion = {}
    for (const c of mine) {
      if (!byRegion[c.region]) byRegion[c.region] = 0
      byRegion[c.region] += c.committed_kg
    }
    const total = Object.values(byRegion).reduce((s, v) => s + v, 0) || 1
    return Object.entries(byRegion)
      .map(([region, kg]) => ({ region, kg, pct: Math.round((kg / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4)
  }, [mine])

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-text-muted text-sm">{t('common.goodMorning')}</p>
          <h1 className="font-display text-2xl font-bold text-paddy">{t('home.greeting', { name: 'Ceylon Fresh Foods' })}</h1>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-paddy/10 text-paddy text-[11px] font-semibold">{t('common.account')}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileSignature} value={stats.activeCount} label={t('buyer.activeContracts')} delay={0} />
        <StatCard icon={Weight} value={`${(stats.totalCommitted / 1000).toFixed(1)}t`} label={t('buyer.totalCommitted')} tone="gold" delay={0.05} />
        <StatCard icon={TrendingUp} value={`${(stats.expectedHarvest / 1000).toFixed(1)}t`} label={t('buyer.expectedHarvest')} tone="teal" delay={0.1} />
        <StatCard icon={Percent} value={`${stats.fulfillmentRate}%`} label={t('buyer.fulfillmentRate')} tone="emerald" delay={0.15} />
      </div>

      {/* Supply forecast chart + Regional share side by side on desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-4">
        <Card className="space-y-3">
          <p className="font-display font-bold text-sm text-paddy">{t('common.weeklyForecast')}</p>
          <div className="h-40">
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
              <Bar dataKey="kg" fill="#2F5233" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Regional supply share */}
      {regionalShare.length > 0 && (
        <Card className="space-y-3 md:mt-0">
          <p className="font-display font-bold text-sm text-paddy">{t('common.regionalSupply')}</p>
          <div className="space-y-3">
            {regionalShare.map((r) => (
              <div key={r.region} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-paddy">{t(`regions.${r.region}`, { defaultValue: r.region })}</span>
                  <span className="text-sm font-semibold text-paddy">{r.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-paddy transition-all"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      </div>

      {/* Post new contract */}
      <div className="space-y-3">
        <Link to="/buyer/post">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-paddy bg-turmeric hover:brightness-110 active:scale-[0.98] transition">
            <Plus size={16} />
            {t('buyer.postNewContract')}
          </button>
        </Link>
        <Link to="/buyer/fulfilment" className="block">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-paddy border-2 border-paddy hover:bg-paddy/5 active:scale-[0.98] transition">
            {t('buyer.viewContractFulfilment')}
          </button>
        </Link>
      </div>
    </div>
  )
}
