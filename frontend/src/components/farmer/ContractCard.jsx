import { useTranslation } from 'react-i18next'
import { MapPin, CalendarClock } from 'lucide-react'
import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import ProgressBar from '../common/ProgressBar.jsx'

const cropEmoji = {
  Tomato: '🍅',
  'Green Chilli': '🌶️',
  Carrot: '🥕',
  'Red Onion': '🧅',
  Rice: '🌾',
  Potato: '🥔',
}

export default function ContractCard({ contract, onCommit }) {
  const { t } = useTranslation()
  const pct = Math.round((contract.committed_kg / contract.total_kg) * 100)

  return (
    <Card hoverable className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-emerald/10 border border-surface-border grid place-items-center text-xl">
            {cropEmoji[contract.crop_type] || '🌱'}
          </span>
          <div>
            <p className="font-display font-bold leading-tight">{contract.crop_type}</p>
            <p className="text-xs text-textmuted">
              {t('contract.grade')} {contract.grade}
            </p>
          </div>
        </div>
        <Chip tone={contract.status}>{t(`contract.status.${contract.status}`)}</Chip>
      </div>

      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg font-bold text-mint">
          Rs. {Number(contract.price_per_kg).toLocaleString()}
          <span className="text-xs text-textmuted font-body font-normal">{t('contract.perKg')}</span>
        </p>
        <p className="text-xs text-textmuted">
          {(contract.total_kg / 1000).toFixed(1)}t total
        </p>
      </div>

      <div>
        <ProgressBar value={contract.committed_kg} max={contract.total_kg} />
        <p className="mt-1.5 text-[11px] text-textmuted">{t('contract.quotaFilled', { percent: pct })}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-textmuted">
        <span className="inline-flex items-center gap-1">
          <MapPin size={13} /> {t(`regions.${contract.region}`, { defaultValue: contract.region })}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock size={13} />
          {t('contract.deadline', { date: contract.commit_deadline })}
        </span>
      </div>

      {onCommit && contract.status === 'open' && (
        <button onClick={() => onCommit(contract)} className="btn-primary w-full mt-1">
          {t('contract.commit')}
        </button>
      )}
    </Card>
  )
}
