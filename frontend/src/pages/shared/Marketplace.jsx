import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import ContractCard from '../../components/farmer/ContractCard.jsx'
import Modal from '../../components/common/Modal.jsx'
import Button from '../../components/common/Button.jsx'
import { useContracts, commitToContract } from '../../hooks/useContracts.js'

const REGIONS = ['Dambulla', 'Nuwara Eliya', 'Jaffna', 'Colombo', 'Anuradhapura', 'Matara']

export default function Marketplace() {
  const { t } = useTranslation()
  const { data: contracts = [], isLoading } = useContracts()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const [committing, setCommitting] = useState(null) // contract being committed
  const [qty, setQty] = useState('')
  const [flash, setFlash] = useState('')

  const filtered = useMemo(
    () =>
      contracts.filter(
        (c) =>
          c.status === 'open' &&
          (region === 'all' || c.region === region) &&
          (!query || c.crop_type.toLowerCase().includes(query.toLowerCase())),
      ),
    [contracts, query, region],
  )

  async function submitCommit(e) {
    e.preventDefault()
    const amount = parseInt(qty, 10)
    if (!amount || amount <= 0 || !committing) return
    const res = await commitToContract(committing.id, amount)
    setFlash(res.synced ? t('contract.committed') : t('contract.queuedOffline'))
    setCommitting(null)
    setQty('')
    setTimeout(() => setFlash(''), 3200)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t('contract.openContracts')}</h1>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textmuted/60" />
          <input
            className="input-dark pl-9"
            placeholder={t('contract.searchCrops')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input-dark !w-auto" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="all">{t('contract.allRegions')}</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {t(`regions.${r}`, { defaultValue: r })}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-textmuted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-textmuted text-sm py-16 text-center">{t('common.empty')}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ContractCard key={c.id} contract={c} onCommit={setCommitting} />
          ))}
        </div>
      )}

      {/* Commit modal */}
      <Modal open={!!committing} onClose={() => setCommitting(null)} title={t('contract.commitTitle')}>
        {committing && (
          <form onSubmit={submitCommit} className="space-y-4">
            <div className="rounded-xl bg-forest border border-surface-border p-3.5 flex items-center justify-between">
              <div>
                <p className="font-display font-bold">{committing.crop_type}</p>
                <p className="text-xs text-textmuted">Rs. {committing.price_per_kg}/kg · {t(`regions.${committing.region}`, { defaultValue: committing.region })}</p>
              </div>
              <p className="text-xs text-textmuted">
                {t('contract.remaining', { kg: committing.total_kg - committing.committed_kg })}
              </p>
            </div>
            <div>
              <label className="label-muted" htmlFor="qty">{t('contract.quantity')}</label>
              <input
                id="qty"
                type="number"
                min={1}
                max={committing.total_kg - committing.committed_kg}
                required
                className="input-dark"
                placeholder="e.g. 250"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => setCommitting(null)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('contract.commit')}</Button>
            </div>
          </form>
        )}
      </Modal>

      {flash && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 bg-emerald-mint text-forest text-xs font-bold px-5 py-2.5 rounded-full shadow-glow animate-pulse">
          {flash}
        </div>
      )}
    </div>
  )
}
