import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Calendar } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import Button from '../../components/common/Button.jsx'
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
}

export default function CommitmentDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ['buyer-commitments'],
    queryFn: async () => (await api.get('/commitments/mine')).data,
  })

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: async () => (await api.get('/contracts?status_filter=all')).data,
  })

  const commitment = commitments.find((c) => c.id === id)
  const contract = commitment ? contracts.find((x) => x.id === commitment.contract_id) : null

  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState({ delivered_qty_kg: '', quality_grade: 'Grade A' })

  async function confirmDelivery() {
    if (!commitment) return
    setConfirming(true)
    try {
      await api.post('/deliveries', {
        commitment_id: commitment.id,
        delivered_qty_kg: parseFloat(form.delivered_qty_kg) || commitment.quantity_kg,
        quality_grade: form.quality_grade,
      })
      queryClient.invalidateQueries({ queryKey: ['buyer-commitments'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      showToast(t('buyer.deliveryConfirm') + ' ✓', 'success')
      navigate('/buyer/fulfilment')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setConfirming(false)
    }
  }

  async function markPaid() {
    if (!commitment) return
    setConfirming(true)
    try {
      await api.patch(`/commitments/${commitment.id}/status`, { status: 'paid' })
      queryClient.invalidateQueries({ queryKey: ['buyer-commitments'] })
      showToast('Marked as paid ✓', 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setConfirming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-paddy/20 border-t-paddy rounded-full animate-spin" />
      </div>
    )
  }

  if (!commitment || !contract) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-text-muted text-sm">Commitment not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>{t('common.back')}</Button>
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
          <h1 className="font-display text-2xl font-bold text-paddy">{commitment.farmer_name || 'Farmer'}</h1>
        </div>
        <Chip tone={commitment.status}>{STATUS_LABEL[commitment.status] || commitment.status}</Chip>
      </div>

      {/* Details */}
      <Card className="space-y-0">
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Committed quantity</span>
          <span className="text-sm font-semibold text-paddy">{commitment.quantity_kg} kg</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Crop journey</span>
          <span className="text-sm font-semibold text-paddy">{STATUS_LABEL[commitment.status] || commitment.status}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Expected delivery</span>
          <span className="text-sm font-semibold text-paddy flex items-center gap-1">
            <Calendar size={13} /> {contract.delivery_date || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-text-muted">Delivered so far</span>
          <span className="text-sm font-semibold text-paddy">{commitment.delivered_qty_kg || 0} kg</span>
        </div>
      </Card>

      {/* Mark as delivered */}
      {(commitment.status === 'harvested' || commitment.status === 'ready' || commitment.status === 'growing') && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <label className="label-muted" htmlFor="delivered_qty">QUANTITY RECEIVED IN KG</label>
              <input
                id="delivered_qty"
                type="number"
                min={1}
                className="input-field"
                placeholder={commitment.quantity_kg.toString()}
                value={form.delivered_qty_kg}
                onChange={(e) => setForm((f) => ({ ...f, delivered_qty_kg: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-muted" htmlFor="quality">QUALITY GRADE ON ARRIVAL</label>
              <select
                id="quality"
                className="input-field"
                value={form.quality_grade}
                onChange={(e) => setForm((f) => ({ ...f, quality_grade: e.target.value }))}
              >
                {CROP_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </Card>

          <Button onClick={confirmDelivery} loading={confirming} className="w-full">
            Confirm Delivery
          </Button>
        </div>
      )}

      {/* Mark as paid */}
      {commitment.status === 'delivered' && (
        <Button onClick={markPaid} loading={confirming} className="w-full">
          Mark as Paid
        </Button>
      )}

      {/* Done */}
      {commitment.status === 'paid' && (
        <Card className="text-center py-6">
          <CheckCircle2 size={28} className="mx-auto mb-2 text-teal" />
          <p className="text-sm text-text-muted">Payment completed</p>
        </Card>
      )}

      {/* Back to fulfillment */}
      <button
        onClick={() => navigate('/buyer/fulfilment')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Fulfillment
      </button>
    </div>
  )
}
