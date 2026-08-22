import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save, User } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import api from '../../lib/api.js'

const REGIONS = ['Dambulla', 'Nuwara Eliya', 'Jaffna', 'Colombo', 'Anuradhapura', 'Matara']
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
]

const roleBadge = {
  farmer: 'bg-emerald/15 text-mint border border-emerald/40',
  buyer: 'bg-gold/15 text-gold border border-gold/40',
  officer: 'bg-mint/15 text-mint border border-mint/40',
}

export default function Profile() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    region: user?.region || 'Dambulla',
    preferred_language: user?.preferred_language || 'en',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.put('/auth/profile', form)
      localStorage.setItem('cc_user', JSON.stringify(data))
      window.dispatchEvent(new Event('cc_user_updated'))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="font-display text-2xl font-bold">{t('nav.profile')}</h1>

      <div className="card-surface p-5 flex items-center gap-4">
        <span className="w-14 h-14 rounded-full bg-emerald/15 border border-emerald/40 grid place-items-center text-xl font-bold text-mint">
          {user?.name?.[0] || '?'}
        </span>
        <div>
          <p className="font-display font-bold">{user?.name}</p>
          <p className="text-xs text-textmuted">{user?.email}</p>
          <span className={`chip mt-1 ${roleBadge[user?.role]}`}>{t(`roles.${user?.role}`)}</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card-surface p-5 space-y-4">
        <div>
          <label className="label-muted" htmlFor="name">{t('auth.name')}</label>
          <input
            id="name"
            required
            minLength={2}
            className="input-dark"
            value={form.name}
            onChange={set('name')}
          />
        </div>

        <div>
          <label className="label-muted" htmlFor="phone">{t('auth.phone')}</label>
          <input
            id="phone"
            type="tel"
            className="input-dark"
            placeholder="+94 7X XXX XXXX"
            value={form.phone}
            onChange={set('phone')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-muted" htmlFor="region">{t('auth.region')}</label>
            <select id="region" className="input-dark" value={form.region} onChange={set('region')}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-muted" htmlFor="lang">{t('auth.language')}</label>
            <select id="lang" className="input-dark" value={form.preferred_language} onChange={set('preferred_language')}>
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-alert text-sm bg-alert/10 border border-alert/30 rounded-xl px-4 py-2.5">{error}</p>
        )}
        {success && (
          <p className="text-mint text-sm bg-emerald/10 border border-emerald/30 rounded-xl px-4 py-2.5">Profile updated!</p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          <Save size={16} />
          {t('common.save')}
        </Button>
      </form>

      <button
        onClick={() => { logout(); navigate('/login') }}
        className="w-full text-center text-sm text-textmuted hover:text-alert transition py-2"
      >
        {t('nav.logout')}
      </button>
    </div>
  )
}
