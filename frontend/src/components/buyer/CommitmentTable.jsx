import { useTranslation } from 'react-i18next'
import Card from '../common/Card.jsx'

export default function CommitmentTable({ rows = [] }) {
  const { t } = useTranslation()

  return (
    <Card className="space-y-3">
      <p className="font-display font-bold text-sm text-paddy">{t('buyer.commitmentsTable')}</p>
      {rows.length === 0 ? (
        <p className="text-text-muted text-xs py-6 text-center">{t('buyer.noCommitments')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted border-b border-surface-border">
                <th className="text-left py-2 font-medium">{t('buyer.farmer')}</th>
                <th className="text-left py-2 font-medium">{t('buyer.crop')}</th>
                <th className="text-right py-2 font-medium">{t('buyer.qty')}</th>
                <th className="text-right py-2 font-medium">{t('buyer.date')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id || i} className="border-b border-surface-border/50">
                  <td className="py-2 font-medium text-paddy">{r.farmer_name || '—'}</td>
                  <td className="py-2 text-text-muted">{r.crop_type}</td>
                  <td className="py-2 text-right">{r.quantity_kg?.toLocaleString()} kg</td>
                  <td className="py-2 text-right text-text-muted">{r.committed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
