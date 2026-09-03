import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import { MOCK_CONTRACTS } from '../../lib/mockData.js'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'

const FILTER_TABS = ['All crops', 'Region', 'Price', 'Delivery date']

export default function Marketplace() {
  const { t } = useTranslation()
  const contracts = MOCK_CONTRACTS
  const isLoading = false
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All crops')
  const [selectedRegion, setSelectedRegion] = useState('')

  const filtered = useMemo(() => {
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
  }, [contracts, search, selectedRegion])

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.marketplace')}</h1>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder={t('contract.searchPlaceholder') || 'Search crop or buyer'}
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
          <p className="text-text-muted text-sm">{t('common.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const remaining = c.total_kg - c.committed_kg
            const pct = Math.round((c.committed_kg / Math.max(c.total_kg, 1)) * 100)
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
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Commit by</p>
                      <p className="font-display font-bold text-sm text-turmeric">{c.commit_deadline || '—'}</p>
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
                    <p className="text-[11px] text-text-muted">
                      {remaining.toLocaleString()} kg remaining
                    </p>
                  </div>

                  {/* Commit button */}
                  <Link to={`/marketplace/${c.id}`}>
                    <button className="w-full rounded-xl px-4 py-2.5 font-display font-semibold text-sm text-white bg-paddy hover:brightness-110 active:scale-[0.98] transition">
                      Commit
                    </button>
                  </Link>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
