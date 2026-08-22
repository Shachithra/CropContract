import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tractor, Briefcase, ClipboardCheck } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'

const ROLES = [
  { value: 'farmer', icon: Tractor },
  { value: 'buyer', icon: Briefcase },
  { value: 'officer', icon: ClipboardCheck },
]

const REGIONS = ['Dambulla', 'Nuwara Eliya', 'Jaffna', 'Colombo', 'Anuradhapura', 'Matara']
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
]

export default function Register() {
  const { t } = useTranslation()
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'farmer',
    region: 'Dambulla',
    phone: '',
    preferred_language: 'en',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      const u = await register(api, form)
      navigate(homePathFor(u.role), { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Registration failed — check your details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-3xl font-bold">{t('auth.createAccount')}</h1>
        <p className="text-textmuted text-sm mt-1 mb-8">{t('tagline')}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Role picker */}
          <div>
            <label className="label-muted">{t('auth.role')}</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3.5 font-display text-xs font-semibold transition ${
                    form.role === value
                      ? 'border-emerald bg-emerald/10 text-mint shadow-glow'
                      : 'border-surface-border bg-surface text-textmuted hover:border-emerald/40'
                  }`}
                >
                  <Icon size={20} />
                  {t(`auth.${value}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-muted" htmlFor="name">{t('auth.name')}</label>
            <input id="name" required minLength={2} className="input-dark" value={form.name} onChange={set('name')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-muted" htmlFor="email">{t('auth.email')}</label>
              <input id="email" type="email" required className="input-dark" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label-muted" htmlFor="password">{t('auth.password')}</label>
              <input id="password" type="password" required className="input-dark" value={form.password} onChange={set('password')} />
            </div>
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
              <select
                id="lang"
                className="input-dark"
                value={form.preferred_language}
                onChange={(e) => {
                  setForm((f) => ({ ...f, preferred_language: e.target.value }))
                }}
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-alert text-sm bg-alert/10 border border-alert/30 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {t('auth.signUp')}
          </Button>
        </form>

        <p className="mt-6 text-sm text-textmuted text-center">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-emerald hover:text-mint transition">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
