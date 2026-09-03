import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScanLine, ArrowRight, MapPin, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import GrowthThread from '../../components/farmer/GrowthThread.jsx'
import AlertBanner from '../../components/farmer/AlertBanner.jsx'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import { useContracts, useMyCommitments } from '../../hooks/useContracts.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api.js'

export default function FarmerHome() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: commitments = [] } = useMyCommitments()
  const { data: contracts = [] } = useContracts()

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', user?.region],
    queryFn: async () => {
      if (!user?.region) return []
      const { data } = await api.get(`/alerts/region/${encodeURIComponent(user.region)}`)
      return data
    },
    enabled: !!user?.region,
    staleTime: 60_000,
  })

  const latestAlert = alerts[0]

  const activeCommitments = useMemo(
    () => commitments.filter((c) => c.status === 'active' || c.status === 'pending-sync'),
    [commitments],
  )

  const latest = activeCommitments[0]
  const latestContract = latest ? contracts.find((x) => x.id === latest.contract_id) : null

  const openContracts = useMemo(
    () => contracts.filter((c) => c.status === 'open').slice(0, 4),
    [contracts],
  )

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-text-muted text-sm">{t('home.goodMorning')}</p>
        <h1 className="font-display text-2xl font-bold text-paddy">
          {user?.name || 'Farmer'}
        </h1>
      </div>

      {/* Regional alert */}
      {latestAlert && <AlertBanner alert={latestAlert} />}

      {/* Active contract card */}
      {latest && latestContract ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-display font-bold text-paddy">
                {latestContract.crop_type}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {t('home.contractWith', { buyer: latestContract.buyer_name || t('buyer.farmer') })}
              </p>
            </div>
            <Chip tone="growing">{t('home.growing')}</Chip>
          </div>

          <GrowthThread
            progress={Math.min(latest.id % 5, 3)}
          />

          <div className="flex gap-3 pt-2">
            <Link
              to="/farmer/scan"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-white bg-turmeric hover:brightness-110 active:scale-[0.98] transition"
            >
              <ScanLine size={16} />
              {t('nav.scan')}
            </Link>
            <Link
              to="/marketplace"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-paddy border border-paddy/30 hover:bg-paddy/5 active:scale-[0.98] transition"
            >
              {t('contract.findContracts')}
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-8 space-y-3">
          <div className="w-14 h-14 rounded-full bg-paddy/10 grid place-items-center mx-auto">
            <ScanLine size={24} className="text-paddy" />
          </div>
          <p className="text-text-muted text-sm">{t('common.empty')}</p>
          <Link to="/marketplace" className="btn-turmeric inline-flex">
            {t('contract.openContracts')} <ArrowRight size={15} />
          </Link>
        </Card>
      )}

      {/* Open contracts near you */}
      {openContracts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold text-sm text-paddy">
              {t('contract.openContracts')}
            </p>
            <Link to="/marketplace" className="text-xs font-semibold text-turmeric flex items-center gap-1">
              {t('common.seeAll')} <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
            {openContracts.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="min-w-[200px] flex-1"
              >
                <Link to={`/marketplace/${c.id}`}>
                  <Card hoverable className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Chip tone="open">{c.crop_type}</Chip>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      {t(`regions.${c.region}`, { defaultValue: c.region })}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {t('common.commitIn', { days: c.commit_deadline ? Math.max(0, Math.ceil((new Date(c.commit_deadline) - new Date()) / 86400000)) : '—' })}
                    </p>
                    <p className="font-display font-bold text-sm text-paddy">
                      Rs. {c.price_per_kg}/kg
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
