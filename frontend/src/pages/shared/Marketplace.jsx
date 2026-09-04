import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import { useContracts, useMyCommitments } from '../../hooks/useContracts.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'

const FILTER_TABS = ['All crops', 'Region', 'Price', 'Delivery date']
const COMMITMENT_STATUS = {
  active: 'Active',
  growing: 'Growing',
  ready: 'Ready',
  harvested: 'Harvested',
  delivered: 'Delivered',
  paid: 'Paid',
  synced: 'Synced',
}

export default function Marketplace() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: contracts = [], isLoading } = useContracts()
  const { data: commitments = [] } = useMyCommitments(true, { refetchInterval: 15000 })
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All crops')
  const [selectedRegion, setSelectedRegion] = useState('')

  const isBuyer = user?.role === 'buyer'

  const myContracts = useMemo(() => {
    if (!isBuyer) return []
    return contracts.filter((c) => c.buyer_id === user?.id)
  }, [contracts, isBuyer, user?.id])

  const myCommitments = useMemo(() => {
    if (!isBuyer) return []
    return commitments
  }, [commitments, isBuyer])

  const filtered = useMemo(() => {
    if (isBuyer) {
      let result = myContracts
      if (search) {
        const q = search.toLowerCase()
        result = result.filter(
          (c) =>
            c.crop_type?.toLowerCase().includes(q) ||
            c.region?.toLowerCase().includes(q),
        )
      }
      if (selectedRegion) {
        result = result.filter((c) => c.region === selectedRegion)
      }
      return result
    }

    let result = contracts.filter((c) => c.status === 'open')
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.crop_type?.toLowerCase().includes(q) ||
          c.buyer_name?.toLowerCase().includes(q) ||
          c.region?.toLowerCase().includes(q),
      )
    }
    if (selectedRegion) {
      result = result.filter((c) => c.region === selectedRegion)
    }
    return result
  }, [contracts, myContracts, isBuyer, search, selectedRegion])

  function getCommitmentsForContract(contractId) {
    return myCommitments.filter((c) => c.contract_id === contractId)
  }

  return (
    <div className="space-y-4 md:max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-paddy">
        {isBuyer ? t('nav.myContracts') || 'My Contracts' : t('nav.marketplace')}
      </h1>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder={isBuyer ? 'Search crop or region...' : (t('contract.searchPlaceholder') || 'Search crop or buyer')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
              activeFilter === tab
                ? 'bg-paddy text-white border-paddy'
                : 'bg-white text-text-muted border-surface-border hover:border-paddy/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Region filter dropdown */}
      {activeFilter === 'Region' && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SRI_LANKA_DISTRICTS.slice(0, 12).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(selectedRegion === r ? '' : r)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition border ${
                selectedRegion === r
                  ? 'bg-turmeric text-white border-turmeric'
                  : 'bg-white text-text-muted border-surface-border'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Contract list */}
      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">
            {isBuyer ? 'No contracts yet. Post a contract to get started.' : t('common.empty')}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const remaining = c.total_kg - c.committed_kg
            const pct = Math.round((c.committed_kg / Math.max(c.total_kg, 1)) * 100)
            const contractCommitments = isBuyer ? getCommitmentsForContract(c.id) : []
            const deliveredKg = contractCommitments.reduce((s, cm) => s + (cm.delivered_qty_kg || 0), 0)

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-paddy">{c.crop_type}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {c.buyer_name || 'Buyer'} · {t(`regions.${c.region}`, { defaultValue: c.region })}
                      </p>
                    </div>
                    {isBuyer && (
                      <Chip tone={c.status}>{c.status}</Chip>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('contract.requiredKg') || 'Required'}</p>
                      <p className="font-display font-bold text-sm text-paddy">{c.total_kg?.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('contract.pricePerKg')}</p>
                      <p className="font-display font-bold text-sm text-paddy">Rs. {c.price_per_kg}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">
                        {isBuyer ? 'Delivery' : 'Commit by'}
                      </p>
                      <p className="font-display font-bold text-sm text-turmeric">
                        {isBuyer ? (c.delivery_date || '—') : (c.commit_deadline || '—')}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-surface overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full bg-turmeric"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-text-muted">
                      <span>{c.committed_kg?.toLocaleString()} kg committed</span>
                      <span>{remaining.toLocaleString()} kg remaining</span>
                    </div>
                  </div>

                  {/* Buyer: show commitment summary */}
                  {isBuyer && contractCommitments.length > 0 && (
                    <div className="bg-paddy/5 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        Farmer Commitments ({contractCommitments.length})
                      </p>
                      {contractCommitments.slice(0, 3).map((cm) => (
                        <div key={cm.id} className="flex items-center justify-between">
                          <span className="text-xs text-paddy font-medium">{cm.farmer_name || 'Farmer'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">{cm.quantity_kg} kg</span>
                            <Chip tone={cm.status}>{COMMITMENT_STATUS[cm.status] || cm.status}</Chip>
                          </div>
                        </div>
                      ))}
                      {contractCommitments.length > 3 && (
                        <p className="text-[11px] text-text-muted text-center">
                          +{contractCommitments.length - 3} more
                        </p>
                      )}
                      {deliveredKg > 0 && (
                        <div className="flex justify-between text-xs pt-1 border-t border-surface-border/60">
                          <span className="text-text-muted">Delivered</span>
                          <span className="font-semibold text-paddy">{deliveredKg.toLocaleString()} kg</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  {isBuyer ? (
                    <Link to={`/buyer/contract/${c.id}`}>
                      <button className="w-full rounded-xl px-4 py-2.5 font-display font-semibold text-sm text-white bg-paddy hover:brightness-110 active:scale-[0.98] transition">
                        View Details
                      </button>
                    </Link>
                  ) : (
                    <Link to={`/marketplace/${c.id}`}>
                      <button className="w-full rounded-xl px-4 py-2.5 font-display font-semibold text-sm text-white bg-paddy hover:brightness-110 active:scale-[0.98] transition">
                        Commit
                      </button>
                    </Link>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
