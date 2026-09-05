import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Calendar, CheckCircle2, MessageSquarePlus, Flag } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import Sheet from '../../components/common/Sheet.jsx'
import ReviewForm from '../../components/common/ReviewForm.jsx'
import ReportForm from '../../components/common/ReportForm.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'
import { CROP_GRADES } from '../../lib/sriLankaCrops.js'

const STATUS_LABEL = {
  active: 'Active',
  growing: 'Growing',
  ready: 'Ready',
  harvested: 'Harvested',
  delivered: 'Delivered',
  paid: 'Paid',
  synced: 'Synced',
}

export default function BuyerContractDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(null)
  const [deliveryForm, setDeliveryForm] = useState({})
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: async () => (await api.get('/contracts?status_filter=all')).data,
    refetchInterval: 15000,
  })

  const { data: commitments = [], isLoading: loadingCommitments } = useQuery({
    queryKey: ['buyer-commitments'],
    queryFn: async () => (await api.get('/commitments/mine')).data,
    refetchInterval: 15000,
  })

  const isLoading = loadingContracts || loadingCommitments

  const contract = useMemo(() => contracts.find((c) => c.id === id), [contracts, id])

  const contractCommitments = useMemo(
    () => commitments.filter((c) => c.contract_id === id),
    [commitments, id],
  )

  const paidCommitmentIds = useMemo(
    () => contractCommitments.filter((c) => c.status === 'paid').map((c) => c.id),
    [contractCommitments],
  )

  const { data: reviewChecks = {} } = useQuery({
    queryKey: ['reviewChecks', paidCommitmentIds],
    queryFn: async () => {
      const checks = {}
      for (const cid of paidCommitmentIds) {
        const c = contractCommitments.find((x) => x.id === cid)
        if (c?.farmer_id) {
          try {
            const { data } = await api.get(`/reviews/check/${c.farmer_id}?contract_id=${id}`)
            checks[cid] = data.reviewed
          } catch { checks[cid] = false }
        }
      }
      return checks
    },
    enabled: paidCommitmentIds.length > 0,
  })

  const paidFarmerIds = useMemo(
    () => contractCommitments.filter((c) => c.status === 'paid' && c.farmer_id).map((c) => c.id),
    [contractCommitments],
  )

  const { data: reportChecks = {} } = useQuery({
    queryKey: ['reportChecks', paidFarmerIds, id],
    queryFn: async () => {
      const checks = {}
      for (const cid of paidFarmerIds) {
        const c = contractCommitments.find((x) => x.id === cid)
        if (c?.farmer_id) {
          try {
            const { data } = await api.get(`/reports/check/${c.farmer_id}?contract_id=${id}`)
            checks[cid] = data.reported
          } catch { checks[cid] = false }
        }
      }
      return checks
    },
    enabled: paidFarmerIds.length > 0,
  })

  const pct = contract ? Math.round((contract.committed_kg / Math.max(contract.total_kg, 1)) * 100) : 0
  const deliveredKg = contractCommitments.reduce((s, c) => s + (c.delivered_qty_kg || 0), 0)
  const circumference = 2 * Math.PI * 42
  const dashoffset = circumference - (pct / 100) * circumference

  async function confirmDelivery(commitmentId) {
    const form = deliveryForm[commitmentId]
    if (!form?.qty) {
      showToast('Enter quantity received', 'error')
      return
    }
    setConfirming(commitmentId)
    try {
      await api.post('/deliveries', {
        commitment_id: commitmentId,
        delivered_qty_kg: parseFloat(form.qty),
        quality_grade: form.grade || 'Grade A',
      })
      queryClient.invalidateQueries({ queryKey: ['buyer-commitments'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      showToast('Delivery confirmed ✓', 'success')
      setDeliveryForm((f) => { const n = { ...f }; delete n[commitmentId]; return n })
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setConfirming(null)
    }
  }

  async function markPaid(commitmentId) {
    setConfirming(commitmentId)
    try {
      await api.patch(`/commitments/${commitmentId}/status`, { status: 'paid' })
      queryClient.invalidateQueries({ queryKey: ['buyer-commitments'] })
      showToast('Marked as paid ✓', 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setConfirming(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-paddy/20 border-t-paddy rounded-full animate-spin" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-text-muted text-sm">Contract not found</p>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-paddy underline">
          {t('common.back')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">{contract.crop_type}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {t(`regions.${contract.region}`, { defaultValue: contract.region })}
          </p>
        </div>
        <Chip tone={contract.status}>{contract.status}</Chip>
      </div>

      {/* Progress ring */}
      <Card className="flex items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#E8E0CC" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="42"
              fill="none" stroke="#2F5233" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold text-paddy">{pct}%</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">FILLED</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Required</p>
            <p className="font-display font-bold text-lg text-paddy">{contract.total_kg?.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Committed</p>
            <p className="font-display font-bold text-lg text-paddy">{contract.committed_kg?.toLocaleString()} kg</p>
          </div>
        </div>
      </Card>

      {/* Contract details */}
      <Card className="space-y-0">
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Price per kg</span>
          <span className="text-sm font-semibold text-paddy">Rs. {contract.price_per_kg}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Total value</span>
          <span className="text-sm font-semibold text-paddy">Rs. {(contract.total_kg * contract.price_per_kg).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Remaining</span>
          <span className="text-sm font-semibold text-paddy">{(contract.total_kg - contract.committed_kg).toLocaleString()} kg</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted flex items-center gap-1"><Calendar size={13} /> Commit deadline</span>
          <span className="text-sm font-semibold text-turmeric">{contract.commit_deadline || '—'}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted flex items-center gap-1"><Calendar size={13} /> Delivery date</span>
          <span className="text-sm font-semibold text-turmeric">{contract.delivery_date || '—'}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-text-muted">Delivered so far</span>
          <span className="text-sm font-semibold text-paddy">{deliveredKg.toLocaleString()} kg</span>
        </div>
      </Card>

      {/* Notes */}
      {contract.notes && (
        <Card>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-paddy">{contract.notes}</p>
        </Card>
      )}

      {/* Farmer commitments */}
      <div className="space-y-3">
        <p className="font-display font-bold text-sm text-paddy">FARMER COMMITMENTS ({contractCommitments.length})</p>
        {contractCommitments.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-muted text-sm">No commitments yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {contractCommitments.map((c) => {
              const canDeliver = c.status === 'harvested' || c.status === 'ready' || c.status === 'growing'
              const canPay = c.status === 'delivered'
              const form = deliveryForm[c.id] || {}

              return (
                <Card key={c.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-sm text-paddy">{c.farmer_name || 'Farmer'}</p>
                      <p className="text-xs text-text-muted">Committed: {c.quantity_kg} kg · Delivered: {c.delivered_qty_kg || 0} kg</p>
                    </div>
                    <Chip tone={c.status}>{STATUS_LABEL[c.status] || c.status}</Chip>
                  </div>

                  {/* Confirm delivery form */}
                  {canDeliver && (
                    <div className="bg-paddy/5 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Confirm Delivery</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          className="input-field text-sm flex-1"
                          placeholder={`Qty (max ${c.quantity_kg} kg)`}
                          value={form.qty || ''}
                          onChange={(e) => setDeliveryForm((f) => ({
                            ...f,
                            [c.id]: { ...f[c.id], qty: e.target.value },
                          }))}
                        />
                        <select
                          className="input-field text-sm w-28"
                          value={form.grade || 'Grade A'}
                          onChange={(e) => setDeliveryForm((f) => ({
                            ...f,
                            [c.id]: { ...f[c.id], grade: e.target.value },
                          }))}
                        >
                          {CROP_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <button
                        disabled={confirming === c.id || !form.qty}
                        onClick={() => confirmDelivery(c.id)}
                        className="w-full py-2 rounded-xl bg-paddy text-white text-sm font-semibold active:scale-[0.97] disabled:opacity-50 transition"
                      >
                        {confirming === c.id ? 'Confirming...' : 'Confirm Delivery'}
                      </button>
                    </div>
                  )}

                  {/* Mark as paid */}
                  {canPay && (
                    <button
                      disabled={confirming === c.id}
                      onClick={() => markPaid(c.id)}
                      className="w-full py-2 rounded-xl bg-turmeric text-paddy text-sm font-semibold active:scale-[0.97] disabled:opacity-50 transition"
                    >
                      {confirming === c.id ? 'Processing...' : 'Mark as Paid'}
                    </button>
                  )}

                  {/* Paid done */}
                  {c.status === 'paid' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 py-2 text-teal">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-semibold">Payment completed</span>
                      </div>

                      {!reviewChecks[c.id] && c.farmer_id && (
                        <button
                          onClick={() => setReviewTarget({ id: c.farmer_id, name: c.farmer_name || 'Farmer', contractId: id })}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-turmeric text-turmeric text-sm font-semibold active:scale-[0.97] transition"
                        >
                          <MessageSquarePlus size={14} />
                          {t('review.leaveReview')}
                        </button>
                      )}
                      {reviewChecks[c.id] && (
                        <p className="text-xs text-teal font-semibold text-center">{t('review.alreadyReviewed')}</p>
                      )}

                      {!reportChecks[c.id] && c.farmer_id && (
                        <button
                          onClick={() => setReportTarget({ id: c.farmer_id, name: c.farmer_name || 'Farmer', contractId: id })}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-clay/40 text-clay text-sm font-semibold active:scale-[0.97] transition"
                        >
                          <Flag size={14} />
                          {t('report.reportUser')}
                        </button>
                      )}
                      {reportChecks[c.id] && (
                        <p className="text-xs text-clay/60 font-semibold text-center">{t('report.alreadyReported')}</p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Back */}
      <button
        onClick={() => navigate('/marketplace')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Contracts
      </button>

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
