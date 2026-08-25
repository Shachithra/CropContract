import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MapPin, Calendar, ArrowLeft } from 'lucide-react'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import Button from '../../components/common/Button.jsx'
import Sheet from '../../components/common/Sheet.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import api from '../../lib/api.js'
import { queueAction } from '../../lib/db.js'
import { isOnline } from '../../lib/sync.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { showToast } from '../../components/common/Toast.jsx'

export default function ContractDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => (await api.get(`/contracts/${id}`)).data,
    enabled: !!id,
  })

  const [showCommit, setShowCommit] = useState(false)
  const [qty, setQty] = useState(100)
  const [committing, setCommitting] = useState(false)

  if (isLoading) {
    return <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
  }
  if (!contract) {
    return <p className="text-text-muted text-sm py-10 text-center">{t('common.error')}</p>
  }

  const remaining = contract.total_kg - contract.committed_kg
  const pct = Math.round((contract.committed_kg / Math.max(contract.total_kg, 1)) * 100)
  const estimatedPayout = qty * contract.price_per_kg

  async function doCommit() {
    setCommitting(true)
    try {
      const payload = { quantity_kg: qty, client_action_id: crypto.randomUUID() }
      if (!isOnline()) {
        await queueAction('create_commitment', { contract_id: contract.id, quantity_kg: qty })
        showToast(t('contract.queuedOffline'), 'success')
      } else {
        await api.post(`/contracts/${contract.id}/commit`, payload)
        showToast(t('contract.committed'), 'success')
      }
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['commitments'] })
      setShowCommit(false)
      navigate('/farmer/contracts')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-display text-2xl font-bold text-paddy">{contract.crop_type}</h1>
          <Chip tone={contract.status}>{t(`contract.status.${contract.status}`)}</Chip>
        </div>
        <p className="text-sm text-text-muted flex items-center gap-2 mt-1">
          <span className="font-semibold text-turmeric">Rs. {contract.price_per_kg}</span>{t('contract.perKg')}
          <span className="text-surface-border">·</span>
          <MapPin size={13} /> {t(`regions.${contract.region}`, { defaultValue: contract.region })}
        </p>
      </div>

      <Card className="space-y-3">
        <ProgressBar value={contract.committed_kg} max={contract.total_kg} />
        <div className="flex justify-between text-xs text-text-muted">
          <span>{t('contract.quotaFilled', { percent: pct })}</span>
          <span>{contract.committed_kg.toLocaleString()} / {contract.total_kg.toLocaleString()} kg</span>
        </div>
      </Card>

      <Card className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="label-muted">{t('contract.buyer')}</p>
          <p className="font-medium text-paddy">{contract.buyer_name || '—'}</p>
        </div>
        <div>
          <p className="label-muted">{t('contract.region')}</p>
          <p className="font-medium text-paddy">{t(`regions.${contract.region}`, { defaultValue: contract.region })}</p>
        </div>
        <div>
          <p className="label-muted">{t('contract.deadline', { date: '' }).replace(/:.*$/, '')}</p>
          <p className="font-medium text-paddy flex items-center gap-1">
            <Calendar size={13} /> {contract.commit_deadline || '—'}
          </p>
        </div>
        <div>
          <p className="label-muted">{t('contract.delivery', { date: '' }).replace(/:.*$/, '')}</p>
          <p className="font-medium text-paddy flex items-center gap-1">
            <Calendar size={13} /> {contract.delivery_date || '—'}
          </p>
        </div>
      </Card>

      {contract.status === 'open' && user?.role === 'farmer' && (
        <Button onClick={() => setShowCommit(true)} className="w-full">
          {t('contract.commitNow')}
        </Button>
      )}

      <Sheet open={showCommit} onClose={() => setShowCommit(false)} title={t('contract.commitTitle')}>
        <div className="space-y-4">
          <div>
            <label className="label-muted">{t('contract.quantity')}</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 10))}
                className="w-10 h-10 rounded-xl border border-surface-border bg-cream grid place-items-center font-bold text-paddy active:scale-95 transition"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={remaining}
                value={qty}
                onChange={(e) => setQty(Math.min(remaining, Math.max(1, parseInt(e.target.value) || 1)))}
                className="input-field text-center text-lg font-bold w-24"
              />
              <button
                onClick={() => setQty(Math.min(remaining, qty + 10))}
                className="w-10 h-10 rounded-xl border border-surface-border bg-cream grid place-items-center font-bold text-paddy active:scale-95 transition"
              >
                +
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">{t('contract.remaining', { kg: remaining })}</p>
          </div>

          <Card className="bg-cream">
            <p className="text-xs text-text-muted">Estimated payout</p>
            <p className="font-display text-xl font-bold text-paddy">Rs. {estimatedPayout.toLocaleString()}</p>
          </Card>

          <Button onClick={doCommit} loading={committing} className="w-full">
            {t('contract.commit')}
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
