import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import { useTranslation } from 'react-i18next'

export default function FlaggedScanCard({ scan, onReview }) {
  const { t } = useTranslation()
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold text-paddy">{scan.disease}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {scan.farmer_name} · {scan.region} · {scan.scanned_at}
          </p>
        </div>
        <Chip tone={scan.severity}>{scan.severity}</Chip>
      </div>
      <p className="text-xs bg-cream border border-surface-border rounded-xl px-3 py-2 text-text-muted">
        {scan.advice}
      </p>
      {scan.review_status === 'pending' ? (
        <div className="flex gap-2">
          <button onClick={() => onReview(scan.id, 'confirmed')} className="btn-primary flex-1 !py-2 text-xs">
            {t('officer.confirm')}
          </button>
          <button onClick={() => onReview(scan.id, 'dismissed')} className="btn-outline flex-1 !py-2 text-xs">
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
