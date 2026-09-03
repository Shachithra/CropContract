import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Minus, Plus } from 'lucide-react'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import Button from '../../components/common/Button.jsx'
import Sheet from '../../components/common/Sheet.jsx'
import { queueAction } from '../../lib/db.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { showToast } from '../../components/common/Toast.jsx'
import { MOCK_CONTRACTS } from '../../lib/mockData.js'

export default function ContractDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const contract = MOCK_CONTRACTS.find((c) => c.id === Number(id)) || null

  const [showCommit, setShowCommit] = useState(false)
  const [qty, setQty] = useState(100)
  const [committing, setCommitting] = useState(false)
  const [committed, setCommitted] = useState(false)

  if (!contract) {
    return <p className="text-text-muted text-sm py-10 text-center">{t('common.error')}</p>
  }

  const remaining = contract.total_kg - contract.committed_kg
  const estimatedPayout = qty * contract.price_per_kg

  async function doCommit() {
    setCommitting(true)
    try {
      await queueAction('create_commitment', { contract_id: contract.id, quantity_kg: qty })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['commitments'] })
      setShowCommit(false)
      setCommitted(true)
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setCommitting(false)
    }
  }

  useEffect(() => {
    if (committed) {
      const timer = setTimeout(() => navigate('/farmer/contracts'), 1500)
      return () => clearTimeout(timer)
    }
  }, [committed, navigate])

  if (committed) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-teal/20 grid place-items-center"
        >
          <CheckCircle2 size={40} className="text-teal" />
        </motion.div>

        <div>
          <h2 className="font-display text-xl font-bold text-paddy">Successfully Committed</h2>
          <p className="text-sm text-text-muted mt-2">
            {contract.buyer_name || 'The buyer'} has received your {qty} kg commitment.
          </p>
        </div>

        <Button onClick={() => navigate('/farmer/contracts')} className="w-full max-w-xs">
          {t('nav.myContracts')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-paddy">{contract.crop_type}</h1>
        <Chip tone={contract.status}>{t(`contract.status.${contract.status}`)}</Chip>
      </div>

      {/* Details */}
      <div className="space-y-0">
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Buyer</span>
          <span className="text-sm font-semibold text-paddy">{contract.buyer_name || '—'}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Region</span>
          <span className="text-sm font-semibold text-paddy">{t(`regions.${contract.region}`, { defaultValue: contract.region })}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Price</span>
          <span className="text-sm font-semibold text-paddy">Rs. {contract.price_per_kg} / kg</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Required quantity</span>
          <span className="text-sm font-semibold text-paddy">{contract.total_kg?.toLocaleString()} kg</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Commitment deadline</span>
          <span className="text-sm font-semibold text-turmeric">{contract.commit_deadline || '—'}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-text-muted">Delivery date</span>
          <span className="text-sm font-semibold text-paddy">{contract.delivery_date || '—'}</span>
        </div>
      </div>

      {/* Quantity selector */}
      {contract.status === 'open' && user?.role === 'farmer' && (
        <>
          <Card className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setQty(Math.max(1, qty - 10))}
                className="w-12 h-12 rounded-xl border border-surface-border bg-cream grid place-items-center font-bold text-paddy active:scale-95 transition hover:bg-surface"
              >
                <Minus size={20} />
              </button>
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-paddy">{qty}</p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Kg Commitment</p>
              </div>
              <button
                onClick={() => setQty(Math.min(remaining, qty + 10))}
                className="w-12 h-12 rounded-xl border border-surface-border bg-cream grid place-items-center font-bold text-paddy active:scale-95 transition hover:bg-surface"
              >
                <Plus size={20} />
              </button>
            </div>
          </Card>

          {/* Confirm commitment */}
          <Card className="space-y-3 bg-cream">
            <p className="font-display font-bold text-sm text-paddy">Confirm your commitment</p>
            <p className="text-xs text-text-muted">
              {qty} kg of {contract.grade || 'Grade A'} {contract.crop_type} ·{' '}
              <span className="font-semibold text-paddy">Rs. {estimatedPayout.toLocaleString()} estimated</span> ·{' '}
              Delivery by {contract.delivery_date || '—'}
            </p>
            <Button onClick={() => setShowCommit(true)} className="w-full">
              Commit to Contract
            </Button>
          </Card>
        </>
      )}

      {/* Commit sheet */}
      <Sheet open={showCommit} onClose={() => setShowCommit(false)} title="Confirm your commitment">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            {qty} kg of {contract.grade || 'Grade A'} {contract.crop_type} ·{' '}
            <span className="font-semibold text-paddy">Rs. {estimatedPayout.toLocaleString()} estimated</span> ·{' '}
            Delivery by {contract.delivery_date || '—'}
          </p>

          <Button onClick={doCommit} loading={committing} className="w-full">
            {committing ? 'Confirming...' : 'Confirm Commitment'}
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
