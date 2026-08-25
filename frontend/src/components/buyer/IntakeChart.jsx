import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '../common/Card.jsx'
import { useTranslation } from 'react-i18next'

export default function IntakeChart({ data = [] }) {
  const { t } = useTranslation()

  return (
    <Card className="space-y-3">
      <p className="font-display font-bold text-sm text-paddy">{t('buyer.intakeByWeek')}</p>
      {data.length === 0 ? (
        <p className="text-text-muted text-xs py-6 text-center">{t('common.empty')}</p>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="crop" tick={{ fontSize: 11, fill: '#6B6558' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6558' }} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #D4C9B0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="kg" fill="#2F5233" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
