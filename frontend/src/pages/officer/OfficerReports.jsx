import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, User, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import Button from '../../components/common/Button.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'

const STATUS_TONE = {
  pending: 'turmeric',
  reviewed: 'paddy',
  resolved: 'teal',
  dismissed: 'clay',
}

const CATEGORY_LABELS = {
  fraud: 'Fraud / Scam',
  non_payment: 'Non-payment',
  quality_issue: 'Quality Issue',
  delivery_issue: 'Delivery Problem',
  harassment: 'Harassment',
  fake_listing: 'Fake Listing',
  other: 'Other',
}

export default function OfficerReports() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await api.get('/reports')).data,
  })

  const filtered = statusFilter === 'all'
    ? reports
    : reports.filter((r) => r.status === statusFilter)

  const pendingCount = reports.filter((r) => r.status === 'pending').length

  async function updateStatus(reportId, newStatus) {
    try {
      await api.patch(`/reports/${reportId}`, { status: newStatus })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      showToast(`Report ${newStatus}`, 'success')
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">User Reports</h1>
          <p className="text-text-muted text-sm mt-0.5">Review reports from farmers and buyers</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-turmeric/15 text-turmeric text-[11px] font-semibold">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition border ${
              statusFilter === f
                ? 'bg-paddy text-white border-paddy'
                : 'bg-white text-text-muted border-surface-border hover:border-paddy/40'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Flag size={28} className="mx-auto mb-2 text-paddy/30" />
          <p className="text-text-muted text-sm">No reports found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Flag size={14} className="text-clay" />
                    <span className="font-display font-bold text-sm text-paddy">
                      {CATEGORY_LABELS[report.category] || report.category}
                    </span>
                  </div>
                  <Chip tone={STATUS_TONE[report.status]}>{report.status}</Chip>
                </div>

                {/* Reporter → Reported */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-paddy">
                    <User size={12} />
                    <span className="font-semibold">{report.reporter_name || 'Unknown'}</span>
                    <span className="text-text-muted">({report.reporter_role})</span>
                  </div>
                  <span className="text-text-muted">→</span>
                  <div className="flex items-center gap-1.5 text-paddy">
                    <User size={12} />
                    <span className="font-semibold">{report.reported_user_name || 'Unknown'}</span>
                    <span className="text-text-muted">({report.reported_user_role})</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-surface rounded-xl px-3 py-2">
                  <p className="text-sm text-paddy">{report.reason}</p>
                </div>

                {/* Contract link */}
                {report.contract_id && (
                  <p className="text-[11px] text-text-muted flex items-center gap-1">
                    <FileText size={11} /> Contract: {report.contract_id.slice(0, 8)}...
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-[11px] text-text-muted">
                  <Clock size={11} className="inline mr-1" />
                  {report.created_at}
                </p>

                {/* Action buttons */}
                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(report.id, 'reviewed')}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <AlertTriangle size={12} /> Mark Reviewed
                    </Button>
                    <Button
                      onClick={() => updateStatus(report.id, 'resolved')}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <CheckCircle size={12} /> Resolve
                    </Button>
                    <button
                      onClick={() => updateStatus(report.id, 'dismissed')}
                      className="flex-1 py-2 rounded-xl border border-clay/30 text-clay text-xs font-semibold hover:bg-clay/5 active:scale-[0.97] transition flex items-center justify-center gap-1"
                    >
                      <XCircle size={12} /> Dismiss
                    </button>
                  </div>
                )}

                {report.status === 'reviewed' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateStatus(report.id, 'resolved')}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <CheckCircle size={12} /> Resolve
                    </Button>
                    <button
                      onClick={() => updateStatus(report.id, 'dismissed')}
                      className="flex-1 py-2 rounded-xl border border-clay/30 text-clay text-xs font-semibold hover:bg-clay/5 active:scale-[0.97] transition flex items-center justify-center gap-1"
                    >
                      <XCircle size={12} /> Dismiss
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
