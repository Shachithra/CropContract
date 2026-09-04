import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import api from '../../lib/api.js'

const STATUS_LABEL = {
  active: 'Active',
  growing: 'Growing',
  ready: 'Ready',
  harvested: 'Harvested',
  delivered: 'Delivered',
}

export default function ContractFulfilment() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: async () => (await api.get('/contracts?status_filter=all')).data,
    refetchInterval: 15000,
  })

  const { data: commitments = [] } = useQuery({
    queryKey: ['buyer-commitments'],
    queryFn: async () => (await api.get('/commitments/mine')).data,
    refetchInterval: 15000,
  })

  const mine = useMemo(() => contracts.filter((c) => c.buyer_id), [contracts])

  const selectedId = mine[0]?.id
  const selected = mine[0]

  const filteredCommitments = useMemo(
    () => commitments.filter((c) => selectedId && c.contract_id === selectedId),
    [commitments, selectedId],
  )

  const allCommitments = useMemo(
    () => commitments.filter((c) => mine.some((m) => m.id === c.contract_id)),
    [commitments, mine],
  )

  const displayCommitments = filteredCommitments.length > 0 ? filteredCommitments : allCommitments

  if (!selected) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.fulfilment')}</h1>
          <p className="text-text-muted text-sm mt-0.5">{t('buyer.fulfilment')}</p>
        </div>
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">{t('buyer.noCommitments')}</p>
        </Card>
      </div>
    )
  }

  const pct = Math.round((selected.committed_kg / Math.max(selected.total_kg, 1)) * 100)
  const deliveredKg = displayCommitments.reduce((s, c) => s + (c.delivered_qty_kg || 0), 0)
  const circumference = 2 * Math.PI * 42
  const dashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="space-y-4 max-w-lg mx-auto md:max-w-2xl">
      {/* Back */}
      <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Progress ring header */}
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
            <span className="text-[10px] text-text-muted uppercase tracking-wider">FULFILLED</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Committed</p>
            <p className="font-display font-bold text-lg text-paddy">{selected.committed_kg.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Delivered</p>
            <p className="font-display font-bold text-lg text-paddy">{deliveredKg.toLocaleString()} kg</p>
          </div>
        </div>
      </Card>

      {/* Contract details */}
      <Card className="space-y-0">
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Required Quantity</span>
          <span className="text-sm font-semibold text-paddy">{selected.total_kg?.toLocaleString()} kg</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
          <span className="text-sm text-text-muted">Delivered So Far</span>
          <span className="text-sm font-semibold text-paddy">{deliveredKg.toLocaleString()} kg</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-text-muted">Payment Status</span>
          <span className="text-sm font-semibold text-paddy">Partial - Rs. {(deliveredKg * selected.price_per_kg).toLocaleString()} paid</span>
        </div>
      </Card>

      {/* Farmer commitments */}
      <div className="space-y-3">
        <p className="font-display font-bold text-sm text-paddy">FARMER COMMITMENTS</p>
        {displayCommitments.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-muted text-sm">No commitments yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {displayCommitments.map((c) => (
              <Link
                key={c.id}
                to={`/buyer/commitment/${c.id}`}
              >
                <Card hoverable className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-sm text-paddy">{c.farmer_name || 'Farmer'}</p>
                    <p className="text-xs text-text-muted">Commitment: {c.quantity_kg} kg</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip tone={c.status}>{STATUS_LABEL[c.status] || c.status}</Chip>
                    <ChevronRight size={14} className="text-text-muted" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Back to dashboard */}
      <button
        onClick={() => navigate('/buyer')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}
