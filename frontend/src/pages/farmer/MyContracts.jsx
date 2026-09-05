import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ArrowRight, MessageSquarePlus, Flag } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import Sheet from '../../components/common/Sheet.jsx'
import ReviewForm from '../../components/common/ReviewForm.jsx'
import ReportForm from '../../components/common/ReportForm.jsx'
import GrowthThread from '../../components/farmer/GrowthThread.jsx'
import { useContracts, useMyCommitments, useUpdateCommitmentStatus, useSubmitDelivery } from '../../hooks/useContracts.js'
import api from '../../lib/api.js'

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
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const updateStatus = useUpdateCommitmentStatus()
  const submitDelivery = useSubmitDelivery()

  const paidCommitmentIds = useMemo(
    () => commitments.filter((c) => c.status === 'paid').map((c) => c.id),
    [commitments],
  )

  const { data: reviewChecks = {} } = useQuery({
    queryKey: ['reviewChecks', paidCommitmentIds],
    queryFn: async () => {
      const checks = {}
      for (const cid of paidCommitmentIds) {
        const c = commitments.find((x) => x.id === cid)
        if (c?.contract_id) {
          const contract = contracts.find((x) => x.id === c.contract_id)
          if (contract?.buyer_id) {
            try {
              const { data } = await api.get(`/reviews/check/${contract.buyer_id}?contract_id=${c.contract_id}`)
              checks[cid] = data.reviewed
            } catch { checks[cid] = false }
          }
        }
      }
      return checks
    },
    enabled: paidCommitmentIds.length > 0,
  })

  const paidBuyerIds = useMemo(
    () => commitments.filter((c) => {
      if (c.status !== 'paid') return false
      const contract = contracts.find((x) => x.id === c.contract_id)
      return !!contract?.buyer_id
    }).map((c) => c.id),
    [commitments, contracts],
  )

  const { data: reportChecks = {} } = useQuery({
    queryKey: ['reportChecks', paidBuyerIds],
    queryFn: async () => {
      const checks = {}
      for (const cid of paidBuyerIds) {
        const c = commitments.find((x) => x.id === cid)
        if (c?.contract_id) {
          const contract = contracts.find((x) => x.id === c.contract_id)
          if (contract?.buyer_id) {
            try {
              const { data } = await api.get(`/reports/check/${contract.buyer_id}?contract_id=${c.contract_id}`)
              checks[cid] = data.reported
            } catch { checks[cid] = false }
          }
        }
      }
      return checks
    },
    enabled: paidBuyerIds.length > 0,
  })

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

                        {c.status === 'paid' && !reviewChecks[c.id] && contract?.buyer_id && (
                          <button
                            onClick={() => setReviewTarget({ id: contract.buyer_id, name: contract.buyer_name || 'Buyer', contractId: c.contract_id })}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-turmeric text-turmeric text-sm font-semibold active:scale-[0.97] transition"
                          >
                            <MessageSquarePlus size={14} />
                            {t('review.leaveReview')}
                          </button>
                        )}
                        {c.status === 'paid' && reviewChecks[c.id] && (
                          <p className="mt-2 text-xs text-teal font-semibold text-center">{t('review.alreadyReviewed')}</p>
                        )}

                        {c.status === 'paid' && !reportChecks[c.id] && contract?.buyer_id && (
                          <button
                            onClick={() => setReportTarget({ id: contract.buyer_id, name: contract.buyer_name || 'Buyer', contractId: c.contract_id })}
                            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-clay/40 text-clay text-sm font-semibold active:scale-[0.97] transition"
                          >
                            <Flag size={14} />
                            {t('report.reportUser')}
                          </button>
                        )}
                        {c.status === 'paid' && reportChecks[c.id] && (
                          <p className="mt-2 text-xs text-clay/60 font-semibold text-center">{t('report.alreadyReported')}</p>
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

      {/* Review sheet */}
      <Sheet open={!!reviewTarget} onClose={() => setReviewTarget(null)} title={t('review.leaveReview')}>
        {reviewTarget && (
          <ReviewForm
            revieweeId={reviewTarget.id}
            revieweeName={reviewTarget.name}
            contractId={reviewTarget.contractId}
            onSuccess={() => setReviewTarget(null)}
          />
        )}
      </Sheet>

      {/* Report sheet */}
      <Sheet open={!!reportTarget} onClose={() => setReportTarget(null)} title={t('report.reportUser')}>
        {reportTarget && (
          <ReportForm
            reportedUserId={reportTarget.id}
            reportedUserName={reportTarget.name}
            contractId={reportTarget.contractId}
            onSuccess={() => setReportTarget(null)}
          />
        )}
      </Sheet>
    </div>
  )
}
