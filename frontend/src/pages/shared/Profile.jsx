import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.jsx'
import Card from '../../components/common/Card.jsx'
import { requestNotificationPermission } from '../../lib/notifications.js'

export default function Profile() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  async function enableNotifications() {
    await requestNotificationPermission()
  }

  if (!user) return null

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.profile')}</h1>

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-paddy grid place-items-center">
            <span className="text-turmeric font-display font-bold text-2xl">{user.name?.[0] || '?'}</span>
          </div>
          <div>
            <p className="font-display font-bold text-lg text-paddy">{user.name}</p>
            <p className="text-sm text-text-muted">{t(`roles.${user.role}`)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="label-muted">{t('auth.phone')}</p><p className="font-medium text-paddy">{user.phone || '—'}</p></div>
          <div><p className="label-muted">{t('auth.region')}</p><p className="font-medium text-paddy">{t(`regions.${user.region}`, { defaultValue: user.region })}</p></div>
          <div><p className="label-muted">Email</p><p className="font-medium text-paddy">{user.email || '—'}</p></div>
          <div><p className="label-muted">{t('auth.language')}</p><p className="font-medium text-paddy">{user.preferred_language?.toUpperCase()}</p></div>
        </div>
      </Card>

      <Card className="space-y-3">
        <button onClick={enableNotifications} className="btn-outline w-full">
          Enable push notifications
        </button>
        <button onClick={logout} className="btn-danger w-full">
          {t('nav.logout')}
        </button>
      </Card>
    </div>
  )
}
