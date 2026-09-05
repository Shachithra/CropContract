import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Send } from 'lucide-react'
import Button from './Button.jsx'
import api from '../../lib/api.js'
import { showToast } from './Toast.jsx'

const CATEGORIES = [
  'fraud',
  'non_payment',
  'quality_issue',
  'delivery_issue',
  'harassment',
  'fake_listing',
  'other',
]

export default function ReportForm({ reportedUserId, reportedUserName, contractId, onSuccess }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!category || reason.trim().length < 3) return

    setLoading(true)
    try {
      await api.post('/reports', {
        reported_user_id: reportedUserId,
        contract_id: contractId || null,
        category,
        reason: reason.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      showToast(t('report.submitted'), 'success')
      setCategory('')
      setReason('')
      onSuccess?.()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 409) {
        showToast(t('report.alreadyReported'), 'error')
      } else {
        showToast(typeof detail === 'string' ? detail : t('common.error'), 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-clay/10 border border-clay/30 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={16} className="text-clay mt-0.5 shrink-0" />
        <p className="text-xs text-clay">{t('report.warning')}</p>
      </div>

      <div>
        <label className="label-muted">{t('report.category')}</label>
        <select
          className="input-field"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">{t('report.selectCategory')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`report.categories.${c}`)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-muted">{t('report.reason')}</label>
        <textarea
          rows={4}
          className="input-field"
          placeholder={t('report.placeholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={3}
          maxLength={500}
          required
        />
        <p className="text-[11px] text-text-muted mt-1">{reason.length}/500</p>
      </div>

      <Button type="submit" loading={loading} variant="outline" className="w-full flex items-center justify-center gap-2">
        <Send size={14} />
        {t('report.submit')}
      </Button>

      <p className="text-[11px] text-text-muted text-center">{t('report.about')}</p>
    </form>
  )
}
