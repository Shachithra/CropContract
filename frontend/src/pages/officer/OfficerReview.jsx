import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, MapPin, Activity, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import FlaggedScanCard from '../../components/officer/FlaggedScanCard.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'

export default function OfficerReview() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['flagged-scans'],
    queryFn: async () => (await api.get('/scans/flagged')).data,
  })

  const outbreakByRegion = useMemo(() => {
    const map = {}
    for (const s of scans) {
      const key = `${s.region}|${s.disease}`
      if (!map[key]) map[key] = { region: s.region, disease: s.disease, count: 0 }
      map[key].count += 1
    }
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [scans])

  async function review(scanId, action) {
    try {
      await api.post(`/scans/${scanId}/review?action=${action}`)
      queryClient.invalidateQueries({ queryKey: ['flagged-scans'] })
      showToast(action === 'confirmed' ? t('officer.confirmed') : t('officer.dismissed'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t('officer.flaggedScans')}</h1>
        <p className="text-text-muted text-sm mt-0.5">{t('tagline')}</p>
      </div>

      <Card className="space-y-2.5">
        <p className="font-display font-bold text-sm flex items-center gap-2 text-paddy">
          <Activity size={15} className="text-clay" /> {t('officer.outbreakWatch')}
        </p>
        {outbreakByRegion.length === 0 ? (
          <p className="text-text-muted text-xs">{t('officer.empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {outbreakByRegion.slice(0, 6).map((o) => (
              <span
                key={`${o.region}-${o.disease}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                  o.count >= 3
                    ? 'bg-clay/10 text-clay border-clay/40'
                    : 'bg-turmeric/10 text-turmeric border-turmeric/40'
                }`}
              >
                <MapPin size={12} />
                {t(`regions.${o.region}`, { defaultValue: o.region })}: {o.disease} · {o.count} {t('officer.cases')}
              </span>
            ))}
          </div>
        )}
      </Card>

      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : scans.length === 0 ? (
        <Card className="text-center py-12">
          <ShieldAlert size={28} className="mx-auto mb-2 text-paddy/30" />
          <p className="text-text-muted text-sm">{t('officer.empty')}</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {scans.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <FlaggedScanCard scan={s} onReview={review} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
