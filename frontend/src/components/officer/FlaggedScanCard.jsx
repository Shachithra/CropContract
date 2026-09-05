import { useState } from 'react'
import { Leaf } from 'lucide-react'
import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import Button from '../common/Button.jsx'
import { useTranslation } from 'react-i18next'

const SAFETY_OPTIONS = [
  'SAFETY_WASH_HANDS_AFTER_CONTACT',
  'SAFETY_DISPOSE_INFECTED_MATERIAL',
  'SAFETY_AVOID_SPREAD_TO_HEALTHY_PLANTS',
  'SAFETY_USE_CLEAN_TOOLS',
  'SAFETY_USE_PROTECTIVE_GLOVES',
  'SAFETY_IMPROVE_VENTILATION',
  'SAFETY_QUARANTINE_AFFECTED_PLANTS',
]

export default function FlaggedScanCard({ scan, onReview, compact = false }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [solution, setSolution] = useState('')
  const [selectedSafety, setSelectedSafety] = useState(scan.safety_precautions || [])
  const [issueAlert, setIssueAlert] = useState(scan.severity === 'critical')
  const [alertMessage, setAlertMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleSafety(key) {
    setSelectedSafety((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  async function handleSubmitReview(action) {
    setSubmitting(true)
    try {
      await onReview(scan.id, {
        action,
        officer_solution: solution || undefined,
        safety_precautions: selectedSafety.length > 0 ? selectedSafety : undefined,
        issue_alert: issueAlert,
        alert_message: alertMessage || undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (compact) {
    return (
      <Card className="!py-3 cursor-pointer hover:bg-paddy/5 transition" onClick={() => setExpanded(true)}>
        <div className="flex items-center gap-3">
          {scan.image_url ? (
            <img
              src={scan.image_url}
              alt={scan.disease}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-paddy/10 grid place-items-center shrink-0">
              <Leaf size={18} className="text-paddy/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-paddy truncate">
              {scan.crop_type || 'Crop'} · {scan.disease}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {scan.region} · {scan.farmer_name} · {Math.round((scan.confidence || 0) * 100)}% · {scan.scanned_at}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Chip tone={scan.severity}>{scan.severity}</Chip>
            {scan.review_status === 'pending' && (
              <span className="w-2 h-2 rounded-full bg-clay animate-pulse" />
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (!expanded) {
    return (
      <Card className="space-y-3 cursor-pointer hover:bg-paddy/5 transition" onClick={() => setExpanded(true)}>
        <div className="flex items-start gap-3">
          {scan.image_url ? (
            <img
              src={scan.image_url}
              alt={scan.disease}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-paddy/10 grid place-items-center shrink-0">
              <Leaf size={20} className="text-paddy/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-paddy">{scan.disease}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {scan.farmer_name} · {scan.region} · {scan.scanned_at}
                </p>
              </div>
              <Chip tone={scan.severity}>{scan.severity}</Chip>
            </div>
          </div>
        </div>
        <p className="text-xs bg-cream border border-surface-border rounded-xl px-3 py-2 text-text-muted">
          {scan.advice}
        </p>
        {scan.review_status === 'pending' ? (
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleSubmitReview('confirmed') }} className="btn-primary flex-1 !py-2 text-xs" disabled={submitting}>
              {t('officer.confirm')}
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleSubmitReview('dismissed') }} className="btn-outline flex-1 !py-2 text-xs" disabled={submitting}>
              {t('officer.dismiss')}
            </button>
          </div>
        ) : (
          <Chip tone={scan.review_status === 'confirmed' ? 'confirmed' : 'dismissed'}>
            {scan.review_status}
          </Chip>
        )}
      </Card>
    )
  }

  // Expanded detail view
  const isCritical = scan.severity === 'critical'
  const isHigh = scan.severity === 'high'

  return (
    <Card className="space-y-4">
      {/* Image */}
      {scan.image_url && (
        <div className="rounded-xl overflow-hidden border border-surface-border">
          <img src={scan.image_url} alt={scan.disease} className="w-full aspect-video object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold text-lg text-paddy">{scan.disease}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {scan.farmer_name} · {scan.region} · {scan.scanned_at}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={scan.severity}>{scan.severity}</Chip>
          <button onClick={() => setExpanded(false)} className="text-text-muted hover:text-paddy text-xs">
            Collapse
          </button>
        </div>
      </div>

      {/* Scan info */}
      <div className="bg-cream border border-surface-border rounded-xl px-3 py-2">
        <p className="text-xs text-text-muted">
          Confidence: {Math.round((scan.confidence || 0) * 100)}% · Crop: {scan.crop_type}
        </p>
        <p className="text-xs text-text-muted mt-1">{scan.advice}</p>
      </div>

      {/* Severity-based guidance */}
      {isCritical && (
        <div className="bg-clay/10 border border-clay/30 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-clay">{t('scanReview.criticalCase')}</p>
        </div>
      )}
      {isHigh && !isCritical && (
        <div className="bg-turmeric/10 border border-turmeric/30 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-turmeric">{t('scanReview.highCase')}</p>
        </div>
      )}

      {/* Officer Solution */}
      <div className="space-y-2">
        <label className="label-muted">{t('scanReview.officerSolution')}</label>
        <textarea
          rows={3}
          className="input-field"
          placeholder={t('scanReview.solutionPlaceholder')}
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
        />
      </div>

      {/* Safety Precautions */}
      <div className="space-y-2">
        <label className="label-muted">{t('scanReview.safetyPrecautions')}</label>
        <div className="space-y-2">
          {SAFETY_OPTIONS.map((key) => (
            <label key={key} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSafety.includes(key)}
                onChange={() => toggleSafety(key)}
                className="mt-0.5 rounded border-surface-border text-paddy focus:ring-paddy"
              />
              <span className="text-sm text-paddy">{t(`safety.${key}`, key)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Issue Alert Toggle (for critical/high) */}
      {(isCritical || isHigh) && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={issueAlert}
              onChange={(e) => setIssueAlert(e.target.checked)}
              className="rounded border-surface-border text-paddy focus:ring-paddy"
            />
            <span className="text-sm font-semibold text-paddy">
              {t('scanReview.issueRegionalAlert', { region: scan.region })}
            </span>
          </label>
          {issueAlert && (
            <textarea
              rows={2}
              className="input-field"
              placeholder={t('scanReview.alertPlaceholder')}
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
            />
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleSubmitReview('resolved')}
          loading={submitting}
          className="flex-1"
        >
          {t('scanReview.markAsDone')}
        </Button>
        <Button
          onClick={() => handleSubmitReview('confirmed')}
          variant="turmeric"
          loading={submitting}
          className="flex-1"
        >
          {t('scanReview.provideSolution')}
        </Button>
      </div>
    </Card>
  )
}
