import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, MapPin, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import api from '../../lib/api.js'

export default function OfficerReview() {
  const { t } = useTranslation()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/scans/flagged')
      setScans(data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

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
      setScans((prev) => prev.map((s) => (s.id === scanId ? { ...s, review_status: action } : s)))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('officer.flaggedScans')}</h1>
        <p className="text-textmuted text-sm mt-0.5">{t('tagline')}</p>
      </div>

      {/* Outbreak watch */}
      <Card className="space-y-2.5">
        <p className="font-display font-bold text-sm flex items-center gap-2">
          <Activity size={15} className="text-alert" /> {t('officer.outbreakWatch')}
        </p>
        {outbreakByRegion.length === 0 ? (
          <p className="text-textmuted text-xs">{t('officer.empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {outbreakByRegion.slice(0, 6).map((o) => (
              <span
                key={`${o.region}-${o.disease}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                  o.count >= 3
                    ? 'bg-alert/10 text-alert border-alert/40'
                    : 'bg-gold/10 text-gold border-gold/40'
                }`}
              >
                <MapPin size={12} />
                {t(`regions.${o.region}`, { defaultValue: o.region })}: {o.disease} · {o.count} {t('officer.cases')}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Flagged scans */}
      {loading ? (
        <p className="text-textmuted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : scans.length === 0 ? (
        <Card className="text-center py-12">
          <ShieldAlert size={28} className="mx-auto mb-2 text-emerald/60" />
          <p className="text-textmuted text-sm">{t('officer.empty')}</p>
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
              <Card className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold">{s.disease}</p>
                    <p className="text-xs text-textmuted mt-0.5">
                      {s.farmer_name} · {t(`regions.${s.region}`, { defaultValue: s.region })} · {s.scanned_at}
                    </p>
                  </div>
                  <Chip tone={s.severity}>{t(`scan.severity.${s.severity}`)}</Chip>
                </div>
                <p className="text-xs bg-forest border border-surface-border rounded-xl px-3 py-2 text-textmuted">
                  {s.advice}
                </p>
                {s.review_status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => review(s.id, 'confirmed')} className="btn-primary flex-1 !py-2 text-xs">
                      <CheckCircle2 size={14} /> {t('officer.confirm')}
                    </button>
                    <button onClick={() => review(s.id, 'dismissed')} className="btn-outline flex-1 !py-2 text-xs">
                      <XCircle size={14} /> {t('officer.dismiss')}
                    </button>
                  </div>
                ) : (
                  <Chip tone={s.review_status === 'confirmed' ? 'synced' : 'closed'}>
                    {t(`officer.${s.review_status}`)}
                  </Chip>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
