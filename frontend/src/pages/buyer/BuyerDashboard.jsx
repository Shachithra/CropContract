import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileSignature, Unlock, Weight, Percent, Plus } from 'lucide-react'
import StatCard from '../../components/buyer/StatCard.jsx'
import IntakeChart from '../../components/buyer/IntakeChart.jsx'
import CommitmentTable from '../../components/buyer/CommitmentTable.jsx'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import api from '../../lib/api.js'
import { useQuery } from '@tanstack/react-query'

export default function BuyerDashboard() {
  const { t } = useTranslation()

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: async () => (await api.get('/contracts?status_filter=all')).data,
  })

  const mine = useMemo(() => contracts.filter((c) => c.buyer_id), [contracts])

  const { data: commitments = [] } = useQuery({
    queryKey: ['buyer-commitments'],
    queryFn: async () => (await api.get('/commitments/mine')).data,
  })

  const rows = useMemo(
    () =>
      commitments.map((c) => {
        const contract = contracts.find((x) => x.id === c.contract_id)
        return { ...c, crop_type: contract?.crop_type || '—' }
      }),
    [commitments, contracts],
  )

  const stats = useMemo(() => {
    const open = mine.filter((c) => c.status === 'open').length
    const committedKg = mine.reduce((s, c) => s + c.committed_kg, 0)
    const totalKg = mine.reduce((s, c) => s + c.total_kg, 0)
    const pct = totalKg ? Math.round((committedKg / totalKg) * 100) : 0
    return { count: mine.length, open, committedKg, pct }
  }, [mine])

  const chartData = useMemo(() => {
    const byCrop = {}
    for (const c of mine) {
      if (!byCrop[c.crop_type]) byCrop[c.crop_type] = 0
      byCrop[c.crop_type] += c.committed_kg
    }
    return Object.entries(byCrop).map(([crop, kg]) => ({ crop, kg }))
  }, [mine])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.dashboard')}</h1>
        <Link to="/buyer/post" className="btn-turmeric !px-3 !py-2 shrink-0">
          <Plus size={15} />
          {t('nav.post')}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileSignature} value={stats.count} label={t('buyer.totalContracts')} delay={0} />
        <StatCard icon={Unlock} value={stats.open} label={t('buyer.openNow')} tone="gold" delay={0.05} />
        <StatCard icon={Weight} value={`${(stats.committedKg / 1000).toFixed(1)}t`} label={t('buyer.committedVolume')} tone="teal" delay={0.1} />
        <StatCard icon={Percent} value={`${stats.pct}%`} label={t('buyer.fulfillment')} tone="emerald" delay={0.15} />
      </div>

      <div className="space-y-3">
        <p className="font-display font-bold text-sm text-paddy">{t('buyer.myContracts')}</p>
        {mine.length === 0 ? (
          <Card className="text-center py-10 space-y-3">
            <p className="text-text-muted text-sm">{t('buyer.noCommitments')}</p>
            <Link to="/buyer/post" className="btn-turmeric">{t('nav.post')}</Link>
          </Card>
        ) : (
          mine.map((c) => {
            const pct = Math.round((c.committed_kg / Math.max(c.total_kg, 1)) * 100)
            return (
              <Card key={c.id} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-paddy">
                    {c.crop_type}
                    <span className="text-xs text-text-muted font-body font-normal ml-2">
                      Rs. {c.price_per_kg}/kg · {(c.total_kg / 1000).toFixed(1)}t · {t(`regions.${c.region}`, { defaultValue: c.region })}
                    </span>
                  </p>
                  <Chip tone={c.status}>{t(`contract.status.${c.status}`)}</Chip>
                </div>
                <ProgressBar value={c.committed_kg} max={c.total_kg} />
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>{t('contract.quotaFilled', { percent: pct })}</span>
                  <span>{c.committed_kg.toLocaleString()} / {c.total_kg.toLocaleString()} kg</span>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <IntakeChart data={chartData} />
        <CommitmentTable rows={rows.slice(0, 8)} />
      </div>
    </div>
  )
}
