import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import GrowthThread from '../../components/farmer/GrowthThread.jsx'
import { useContracts, useMyCommitments } from '../../hooks/useContracts.js'

export default function MyContracts() {
  const { t } = useTranslation()
  const { data: commitments = [], isLoading } = useMyCommitments()
  const { data: contracts = [] } = useContracts()
  const [openId, setOpenId] = useState(null)

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t('nav.myContracts')}</h1>

      {isLoading ? (
        <p className="text-textmuted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : commitments.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-textmuted text-sm">{t('common.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {commitments.map((c) => {
            const contract = contracts.find((x) => x.id === c.contract_id)
            const open = openId === c.id
            return (
              <Card key={c.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : c.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold">
                      {contract?.crop_type || `Contract #${c.contract_id}`}
                      <span className="text-xs text-textmuted font-body font-normal ml-2">
                        {contract?.region && t(`regions.${contract.region}`, { defaultValue: contract.region })}
                      </span>
                    </p>
                    <p className="text-xs text-textmuted mt-0.5">
                      {c.quantity_kg.toLocaleString()} kg · {t('contract.delivery', { date: contract?.delivery_date || '—' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip tone={c.sync_status}>{t(`contract.status.${c.sync_status}`)}</Chip>
                    <ChevronDown
                      size={16}
                      className={`text-textmuted transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-surface-border/60">
                        <GrowthThread progress={(c.id % 4) + 1} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
