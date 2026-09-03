import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import { useTranslation } from 'react-i18next'

export default function FlaggedScanCard({ scan, onReview, compact = false }) {
  const { t } = useTranslation()

  if (compact) {
    return (
      <Card className="!py-3">
        <div className="flex items-center gap-3">
          {scan.image_url && (
            <img
              src={scan.image_url}
              alt={scan.disease}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-paddy truncate">
              {scan.crop || 'Crop'} · {scan.disease}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {scan.region} · {scan.farmer_name} · {Math.round((scan.confidence || 0) * 100)}% · {scan.scanned_at}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        {scan.image_url && (
          <img
            src={scan.image_url}
            alt={scan.disease}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
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
