import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileSignature, Weight, Banknote, ScanLine, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react'
import StatCard from '../../components/buyer/StatCard.jsx'
import GrowthThread from '../../components/farmer/GrowthThread.jsx'
import Card from '../../components/common/Card.jsx'
import { useContracts, useMyCommitments } from '../../hooks/useContracts.js'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function FarmerHome() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: commitments = [] } = useMyCommitments()
  const { data: contracts = [] } = useContracts()

  const stats = useMemo(() => {
    const active = commitments.filter((c) => c.status === 'active')
    const kg = active.reduce((sum, c) => sum + c.quantity_kg, 0)
    const byId = Object.fromEntries(contracts.map((c) => [c.id, c]))
    const earnings = active.reduce(
      (sum, c) => sum + c.quantity_kg * (byId[c.contract_id]?.price_per_kg || 0),
      0,
    )
    return { count: active.length, kg, earnings }
  }, [commitments, contracts])

  const risk = useMemo(() => {
    // Demo regional risk derived from scan history (high-severity scans nearby)
    const highNearby = commitments.length >= 2 ? 'moderate' : 'low'
    return highNearby
  }, [commitments])

  const latest = commitments[0]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t('home.greeting', { name: user?.name?.split(' ')[0] })}</h1>
          <p className="text-textmuted text-sm mt-0.5">{t('home.subtitle')}</p>
        </div>
        <Link to="/farmer/scan" className="btn-outline !px-3 !py-2 shrink-0">
          <ScanLine size={15} />
          {t('nav.scan')}
        </Link>
      </div>

      {/* Regional alert strip */}
      <div
        className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
          risk === 'moderate'
            ? 'border-gold/40 bg-gold/10 text-gold'
            : 'border-emerald/30 bg-emerald/10 text-mint'
        }`}
      >
        {risk === 'moderate' ? <AlertTriangle size={17} /> : <ShieldCheck size={17} />}
        <span className="font-medium">
          {risk === 'moderate'
            ? t('home.riskModerate')
            : t('home.riskLow')}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileSignature} value={stats.count} label={t('home.activeContracts')} delay={0} />
        <StatCard icon={Weight} value={`${stats.kg.toLocaleString()} kg`} label={t('home.committedKg')} tone="mint" delay={0.05} />
        <StatCard
          icon={Banknote}
          value={`Rs. ${stats.earnings.toLocaleString()}`}
          label={t('home.estEarnings')}
          tone="gold"
          delay={0.1}
        />
        <Link to="/farmer/scan">
          <StatCard icon={ScanLine} value="—" label={t('home.scansDone')} tone="red" delay={0.15} />
        </Link>
      </div>

      {latest ? (
        <Card className="space-y-1">
          <GrowthThread title={t('home.cropJourney')} progress={Math.min(latest.id % 5, 3)} />
        </Card>
      ) : (
        <Card className="text-center py-10 space-y-3">
          <p className="text-textmuted text-sm">{t('common.empty')}</p>
          <Link to="/marketplace" className="btn-primary">
            {t('contract.openContracts')} <ArrowRight size={15} />
          </Link>
        </Card>
      )}
    </div>
  )
}
