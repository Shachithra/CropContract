import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { AlertTriangle, User, Shield } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'

const warningSchema = z.object({
  target_user_id: z.string().min(1, 'Select a user'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  violation_type: z.string().min(1, 'Select a violation type'),
})

const VIOLATION_TYPES = [
  { value: 'pricing', label: 'Pricing violation' },
  { value: 'disease_report', label: 'Disease report issue' },
  { value: 'contract_breach', label: 'Contract breach' },
  { value: 'conduct', label: 'Conduct violation' },
  { value: 'other', label: 'Other' },
]

export default function WarningPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: warnings = [], isLoading } = useQuery({
    queryKey: ['all-warnings'],
    queryFn: async () => (await api.get('/warnings/all')).data,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      // We'll get users from the flagged scans and commitments
      // For now, use a simple approach - get all users via a search
      try {
        const { data } = await api.get('/contracts')
        const buyerIds = [...new Set(data.map(c => c.buyer_id))]
        return buyerIds.map(id => ({ id, name: 'Buyer', role: 'buyer' }))
      } catch {
        return []
      }
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(warningSchema),
    defaultValues: {
      target_user_id: '',
      reason: '',
      violation_type: '',
    },
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      await api.post('/warnings', data)
      queryClient.invalidateQueries({ queryKey: ['all-warnings'] })
      showToast(t('warning.warningIssued'), 'success')
      reset()
      setShowForm(false)
    } catch (err) {
      const detail = err.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  // Group warnings by target user
  const warningsByUser = warnings.reduce((acc, w) => {
    if (!acc[w.target_user_id]) {
      acc[w.target_user_id] = {
        user_id: w.target_user_id,
        user_name: w.target_user_name,
        user_role: w.target_user_role,
        warnings: [],
        total_warnings: 0,
      }
    }
    acc[w.target_user_id].warnings.push(w)
    acc[w.target_user_id].total_warnings = Math.max(acc[w.target_user_id].total_warnings, w.warning_number)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">{t('warning.title')}</h1>
          <p className="text-text-muted text-sm mt-0.5">Issue warnings and manage user compliance</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary !rounded-xl flex items-center gap-2"
        >
          <AlertTriangle size={16} />
          {t('warning.issueWarning')}
        </button>
      </div>

      {/* Issue Warning Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="space-y-4">
            <div>
              <label className="label-muted">{t('warning.targetUser')}</label>
              <select className={`input-field ${errors.target_user_id ? 'border-clay' : ''}`} {...register('target_user_id')}>
                <option value="">Select a user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              {errors.target_user_id && <p className="text-clay text-xs mt-1">{errors.target_user_id.message}</p>}
              <p className="text-[11px] text-text-muted mt-1">Enter user ID manually if not in list</p>
              <input
                type="text"
                className="input-field mt-2"
                placeholder="Or paste User ID here"
                {...register('target_user_id')}
              />
            </div>

            <div>
              <label className="label-muted">{t('warning.violationType')}</label>
              <select className={`input-field ${errors.violation_type ? 'border-clay' : ''}`} {...register('violation_type')}>
                <option value="">Select violation type</option>
                {VIOLATION_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              {errors.violation_type && <p className="text-clay text-xs mt-1">{errors.violation_type.message}</p>}
            </div>

            <div>
              <label className="label-muted">{t('warning.reason')}</label>
              <textarea
                rows={3}
                className={`input-field ${errors.reason ? 'border-clay' : ''}`}
                placeholder="Describe the violation..."
                {...register('reason')}
              />
              {errors.reason && <p className="text-clay text-xs mt-1">{errors.reason.message}</p>}
            </div>

            <div className="bg-turmeric/10 border border-turmeric/30 rounded-xl px-4 py-3">
              <p className="text-xs text-turmeric">
                <strong>Warning progression:</strong> 3 warnings → 7-day ban → 3 more warnings → permanent ban
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowForm(false); reset() }} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit(onSubmit)} loading={loading} variant="danger" className="flex-1">
                {t('warning.issueWarning')}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Warnings by User */}
      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : Object.keys(warningsByUser).length === 0 ? (
        <Card className="text-center py-12">
          <Shield size={28} className="mx-auto mb-2 text-paddy/30" />
          <p className="text-text-muted text-sm">{t('warning.noWarnings')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.values(warningsByUser).map((user, i) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-paddy/10 grid place-items-center">
                      <User size={18} className="text-paddy" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-paddy">{user.user_name}</p>
                      <p className="text-xs text-text-muted">{user.user_role} · ID: {user.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      user.total_warnings >= 3 ? 'bg-clay/15 text-clay' :
                      user.total_warnings >= 2 ? 'bg-turmeric/15 text-turmeric' :
                      'bg-teal/15 text-teal'
                    }`}>
                      {user.total_warnings} warning(s)
                    </span>
                  </div>
                </div>

                {/* Warning history */}
                <div className="space-y-2">
                  {user.warnings.slice(0, 3).map((w) => (
                    <div key={w.id} className="bg-cream border border-surface-border rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-paddy">
                          Warning #{w.warning_number}
                        </span>
                        <span className="text-[11px] text-text-muted">{w.issued_at}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">{w.reason}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip tone="open">{w.violation_type}</Chip>
                        <span className="text-[11px] text-text-muted">by {w.issued_by_name}</span>
                      </div>
                    </div>
                  ))}
                  {user.warnings.length > 3 && (
                    <p className="text-xs text-text-muted text-center">
                      +{user.warnings.length - 3} more warnings
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Back to dashboard */}
      <button
        onClick={() => navigate('/officer')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}
