import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import api from '../../lib/api.js'

export default function ContractFulfilment() {
  const { t } = useTranslation()

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: async () => (await api.get('/contracts?status_filter=all')).data,
  })

  const { data: commitments = [] } = useQuery({
    queryKey: ['buyer-commitments'],
    queryFn: async () => (await api.get('/commitments/mine')).data,
  })

  const mine = useMemo(() => contracts.filter((c) => c.buyer_id), [contracts])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.fulfilment')}</h1>
        <p className="text-text-muted text-sm mt-0.5">{t('buyer.fulfilment')}</p>
      </div>

      {mine.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">{t('buyer.noCommitments')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {mine.map((c) => {
            const pct = Math.round((c.committed_kg / Math.max(c.total_kg, 1)) * 100)
            const contractCommitments = commitments.filter((cm) => cm.contract_id === c.id)
            return (
              <Card key={c.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-paddy">
                    {c.crop_type}
                    <span className="text-xs text-text-muted font-body font-normal ml-2">
                      {t(`regions.${c.region}`, { defaultValue: c.region })}
                    </span>
                  </p>
                  <Chip tone={c.status}>{t(`contract.status.${c.status}`)}</Chip>
                </div>

                <ProgressBar value={c.committed_kg} max={c.total_kg} />
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>{t('contract.quotaFilled', { percent: pct })}</span>
                  <span>{c.committed_kg.toLocaleString()} / {c.total_kg.toLocaleString()} kg</span>
                </div>

                {contractCommitments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-paddy">{t('buyer.commitmentsTable')}</p>
                    {contractCommitments.map((cm) => (
                      <Link
                        key={cm.id}
                        to={`/buyer/commitment/${cm.id}`}
                        className="flex items-center justify-between bg-cream rounded-xl px-3 py-2 text-xs hover:bg-surface transition"
                      >
                        <span className="font-medium text-paddy">{cm.farmer_name || 'Farmer'} · {cm.quantity_kg} kg</span>
                        <span className="flex items-center gap-1 text-text-muted">
                          {cm.committed_at}
                          <ChevronRight size={12} />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
