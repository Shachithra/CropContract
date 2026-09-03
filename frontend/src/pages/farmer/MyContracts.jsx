import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import GrowthThread from '../../components/farmer/GrowthThread.jsx'
import { useContracts, useMyCommitments } from '../../hooks/useContracts.js'

const TABS = ['Active', 'Upcoming', 'Completed']

export default function MyContracts() {
  const { t } = useTranslation()
  const { data: commitments = [], isLoading } = useMyCommitments()
  const { data: contracts = [] } = useContracts()
  const [activeTab, setActiveTab] = useState('Active')
  const [openId, setOpenId] = useState(null)

  const filtered = useMemo(() => {
    return commitments.filter((c) => {
      if (activeTab === 'Active') return c.status === 'active' || c.status === 'pending-sync' || c.status === 'growing'
      if (activeTab === 'Upcoming') return c.status === 'committed' || c.status === 'ready'
      if (activeTab === 'Completed') return c.status === 'delivered' || c.status === 'paid' || c.status === 'synced'
      return true
    })
  }, [commitments, activeTab])

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.myContracts')}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition border ${
              activeTab === tab
                ? 'bg-paddy text-white border-paddy'
                : 'bg-white text-text-muted border-surface-border hover:border-paddy/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contract list */}
      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">
            {activeTab === 'Active'
              ? 'No active contracts'
              : activeTab === 'Upcoming'
                ? 'No upcoming contracts'
                : 'No completed contracts'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const contract = contracts.find((x) => x.id === c.contract_id)
            const open = openId === c.id
            const progress = activeTab === 'Completed' ? 4 : activeTab === 'Upcoming' ? 1 : Math.min(c.id % 5, 3)

            return (
              <Card key={c.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : c.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold text-paddy">
                      {contract?.crop_type || `Contract #${c.contract_id}`}
                      <span className="text-xs text-text-muted font-body font-normal ml-2">
                        {c.quantity_kg.toLocaleString()} kg
                      </span>
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {contract?.buyer_name || 'Buyer'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip tone={c.sync_status || activeTab.toLowerCase()}>
                      {c.sync_status === 'synced' ? 'Synced' : activeTab === 'Completed' ? 'Delivered' : activeTab === 'Upcoming' ? 'Committed' : 'Growing'}
                    </Chip>
                    <ChevronDown
                      size={16}
                      className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-surface-border/60">
                        <GrowthThread progress={progress} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
