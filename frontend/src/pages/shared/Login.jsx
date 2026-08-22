import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Leaf, ScanLine, FileSignature, WifiOff, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'

const DEMOS = [
  { role: 'farmer', labelKey: 'roles.farmer', email: 'farmer@demo.lk' },
  { role: 'buyer', labelKey: 'roles.buyer', email: 'buyer@demo.lk' },
  { role: 'officer', labelKey: 'roles.officer', email: 'officer@demo.lk' },
]

export default function Login() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  async function doLogin(em = email, pw = password) {
    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      const u = await login(api, em, pw)
      navigate(homePathFor(u.role), { replace: true })
    } catch {
      setError(t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-emerald-mint text-forest overflow-hidden">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-white/15 blur-2xl" />
        <div className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="w-10 h-10 rounded-xl bg-forest/90 grid place-items-center">
            <Leaf size={20} className="text-mint" />
          </span>
          CropContract
        </div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-bold leading-[1.05] max-w-md"
          >
            Know demand before you plant.
          </motion.h1>
          <ul className="mt-8 space-y-3 text-sm font-medium max-w-sm">
            <li className="flex items-center gap-3">
              <FileSignature size={18} /> Pre-planting contracts with verified buyers
            </li>
            <li className="flex items-center gap-3">
              <ScanLine size={18} /> AI leaf disease diagnosis in seconds
            </li>
            <li className="flex items-center gap-3">
              <WifiOff size={18} /> Works offline — syncs when you reconnect
            </li>
          </ul>
        </div>
        <p className="text-xs font-semibold opacity-80">MB SPARTANS · Project Nova · Saegis Campus</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="lg:hidden flex items-center gap-2 font-display font-bold text-lg mb-10">
          <span className="w-9 h-9 rounded-xl bg-emerald/15 border border-emerald/40 grid place-items-center">
            <Leaf size={17} className="text-emerald" />
          </span>
          CropContract
        </div>

        <h2 className="font-display text-3xl font-bold">{t('auth.welcomeBack')}</h2>
        <p className="text-textmuted mt-1 mb-8 text-sm">{t('tagline')}</p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            doLogin()
          }}
        >
          <div>
            <label className="label-muted" htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input-dark"
              placeholder="farmer@demo.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label-muted" htmlFor="password">{t('auth.password')}</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="input-dark pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted hover:text-mint transition"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-alert text-sm bg-alert/10 border border-alert/30 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {t('auth.signIn')}
          </Button>
        </form>

        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-wider text-textmuted mb-2.5">
            {t('auth.demoAccounts')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMOS.map((d) => (
              <button
                key={d.role}
                onClick={() => doLogin(d.email, 'demo1234')}
                disabled={loading}
                className="btn-outline !px-2 !py-2 text-xs"
              >
                {t(d.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm text-textmuted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-emerald hover:text-mint transition">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
