import { useTranslation } from 'react-i18next'

/** Table of farmer commitments on the buyer's contracts. */
export default function CommitmentTable({ rows }) {
  const { t } = useTranslation()

  return (
    <div className="card-surface overflow-hidden">
      <p className="font-display font-bold text-sm px-4 pt-4 pb-2">{t('buyer.commitmentsTable')}</p>
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-textmuted border-b border-surface-border">
              <th className="px-4 py-2 font-medium">{t('buyer.farmer')}</th>
              <th className="px-4 py-2 font-medium">{t('buyer.crop')}</th>
              <th className="px-4 py-2 font-medium text-right">{t('buyer.qty')}</th>
              <th className="px-4 py-2 font-medium text-right">{t('buyer.date')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-surface-border/50 last:border-0 hover:bg-white/[0.03] transition">
                <td className="px-4 py-2.5 font-semibold">{r.farmer_name}</td>
                <td className="px-4 py-2.5 text-textmuted">{r.crop_type}</td>
                <td className="px-4 py-2.5 text-right font-display font-bold text-mint">{r.quantity_kg.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-textmuted text-xs">{r.committed_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
