import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, TrendingUp } from 'lucide-react'
import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import ProgressBar from '../common/ProgressBar.jsx'

export default function ContractCard({ contract }) {
  const pct = Math.round((contract.committed_kg / Math.max(contract.total_kg, 1)) * 100)

  return (
    <Link to={`/marketplace/${contract.id}`}>
      <Card hoverable className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display font-bold text-paddy">{contract.crop_type}</p>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
              <span className="font-semibold text-turmeric">Rs. {contract.price_per_kg}</span>/kg
              <span className="text-surface-border">·</span>
              <MapPin size={11} />
              {contract.region}
            </p>
          </div>
          <Chip tone={contract.status}>{contract.status}</Chip>
        </div>

        <ProgressBar value={contract.committed_kg} max={contract.total_kg} />

        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>{contract.committed_kg.toLocaleString()} / {contract.total_kg.toLocaleString()} kg</span>
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {contract.delivery_date || '—'}
          </span>
        </div>

        {contract.buyer_name && (
          <p className="text-[11px] text-text-muted">Buyer: {contract.buyer_name}</p>
        )}
      </Card>
    </Link>
  )
}
