import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import GrowthThread from '../../components/farmer/GrowthThread.jsx'
import { useContracts, useMyCommitments, useUpdateCommitmentStatus, useSubmitDelivery } from '../../hooks/useContracts.js'

const TABS = ['Active', 'Upcoming', 'Completed']
const STATUS_FLOW = ['active', 'growing', 'ready', 'harvested', 'delivered', 'paid']
const STATUS_LABELS = {
  active: 'Mark as Growing',
  growing: 'Mark as Ready',
  ready: 'Mark as Harvested',
  harvested: 'Submit Delivery',
  delivered: 'Mark as Paid',
}
const STATUS_TO_PROGRESS = { active: 0, growing: 1, ready: 2, harvested: 3, delivered: 4, paid: 4 }
const STATUS_LABEL_CHIP = {
  active: 'Active',
  growing: 'Growing',
  ready: 'Ready',
  harvested: 'Harvested',
  delivered: 'Delivered',
  paid: 'Paid',
}
const CROP_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Export']

export default function MyContracts() {
  const { t } = useTranslation()
  const { data: commitments = [], isLoading: loadingCommitments } = useMyCommitments()
  const { data: contracts = [], isLoading: loadingContracts } = useContracts()
  const isLoading = loadingCommitments || loadingContracts
  const [activeTab, setActiveTab] = useState('Active')
  const [openId, setOpenId] = useState(null)
  const [deliveryForms, setDeliveryForms] = useState({})
  const updateStatus = useUpdateCommitmentStatus()
  const submitDelivery = useSubmitDelivery()

  const filtered = useMemo(() => {
    return commitments.filter((c) => {
      if (activeTab === 'Active') return c.status === 'active' || c.status === 'pending-sync' || c.status === 'growing'
      if (activeTab === 'Upcoming') return c.status === 'committed' || c.status === 'ready' || c.status === 'harvested'
      if (activeTab === 'Completed') return c.status === 'delivered' || c.status === 'paid' || c.status === 'synced'
      return true
    })
  }, [commitments, activeTab])

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.myContracts')}</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
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
            const progress = STATUS_TO_PROGRESS[c.status] ?? 0

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
                    <Chip tone={c.status || activeTab.toLowerCase()}>
                      {STATUS_LABEL_CHIP[c.status] || activeTab}
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

                        {c.delivered_qty_kg > 0 && (
                          <p className="mt-2 text-xs text-text-muted text-right">
                            Delivered: <span className="font-semibold text-paddy">{c.delivered_qty_kg} kg</span>
                          </p>
                        )}

                        {c.status === 'harvested' && (
                          <div className="mt-3 space-y-2">
                            <input
                              type="number"
                              min={1}
                              className="input-field text-sm"
                              placeholder={`Qty (max ${c.quantity_kg} kg)`}
                              value={deliveryForms[c.id]?.qty || ''}
                              onChange={(e) => setDeliveryForms((f) => ({
                                ...f,
                                [c.id]: { ...f[c.id], qty: e.target.value },
                              }))}
                            />
                            <select
                              className="input-field text-sm"
                              value={deliveryForms[c.id]?.grade || 'Grade A'}
                              onChange={(e) => setDeliveryForms((f) => ({
                                ...f,
                                [c.id]: { ...f[c.id], grade: e.target.value },
                              }))}
                            >
                              {CROP_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <button
                              disabled={submitDelivery.isPending || !deliveryForms[c.id]?.qty}
                              onClick={() => submitDelivery.mutate({
                                commitmentId: c.id,
                                delivered_qty_kg: parseInt(deliveryForms[c.id].qty),
                                quality_grade: deliveryForms[c.id].grade || 'Grade A',
                              })}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-paddy text-white text-sm font-semibold active:scale-[0.97] disabled:opacity-50 transition"
                            >
                              Submit Delivery
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        )}

                        {STATUS_FLOW.includes(c.status) && c.status !== 'paid' && c.status !== 'harvested' && (
                          <button
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({
                              commitmentId: c.id,
                              status: STATUS_FLOW[STATUS_FLOW.indexOf(c.status) + 1],
                            })}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-paddy text-white text-sm font-semibold active:scale-[0.97] disabled:opacity-50 transition"
                          >
                            {STATUS_LABELS[c.status]}
                            <ArrowRight size={16} />
                          </button>
                        )}

                        {c.status === 'delivered' && (
                          <button
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ commitmentId: c.id, status: 'paid' })}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-paddy text-white text-sm font-semibold active:scale-[0.97] disabled:opacity-50 transition"
                          >
                            Mark as Paid
                            <ArrowRight size={16} />
                          </button>
                        )}
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
