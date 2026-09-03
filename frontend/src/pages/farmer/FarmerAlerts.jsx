import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, MapPin, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../../components/common/Card.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import api from '../../lib/api.js'

export default function FarmerAlerts() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', user?.region],
    queryFn: async () => {
      if (!user?.region) return []
      const { data } = await api.get(`/alerts/region/${encodeURIComponent(user.region)}`)
      return data
    },
    enabled: !!user?.region,
    staleTime: 60_000,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.alerts')}</h1>
        <p className="text-text-muted text-sm mt-0.5">Disease alerts for your region</p>
      </div>

      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : alerts.length === 0 ? (
        <Card className="text-center py-12">
          <AlertTriangle size={28} className="mx-auto mb-2 text-paddy/30" />
          <p className="text-text-muted text-sm">No alerts for your region</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-clay/10 grid place-items-center shrink-0">
                    <AlertTriangle size={18} className="text-clay" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-paddy">{alert.disease}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} className="text-text-muted" />
                      <span className="text-xs text-text-muted">{alert.region}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{alert.message}</p>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock size={12} />
                  <span>{alert.issued_at}</span>
                  {alert.issued_by_name && <span>· {alert.issued_by_name}</span>}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
