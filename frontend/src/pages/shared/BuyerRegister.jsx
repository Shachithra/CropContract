import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'
import LanguageToggle from '../../components/layout/LanguageToggle.jsx'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
]

const buyerSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required').regex(
    /^(\+94|94|0)?[1-9]\d{8}$/,
    'Enter a valid Sri Lankan phone number'
  ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  company_location: z.string().min(1, 'Company location is required'),
  region: z.string().min(1, 'Region is required'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function BuyerRegister() {
  const { t } = useTranslation()
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      company_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      company_location: '',
      region: 'Colombo',
      delivery_address: '',
      delivery_address_2: '',
      preferred_language: 'en',
    },
  })

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  async function onSubmit(data) {
    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      const body = {
        name: data.company_name,
        email: data.email,
        password: data.password,
        role: 'buyer',
        region: data.region,
        phone: data.phone,
        company_name: data.company_name,
        company_location: data.company_location,
        delivery_address: data.delivery_address,
        delivery_address_2: data.delivery_address_2,
        preferred_language: data.preferred_language,
      }
      const u = await register(api, body)
      navigate('/register/success', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : t('auth.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center bg-cream">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pb-8 w-full max-w-md">
        {/* Back button */}
        <div className="w-full flex justify-start mb-4">
          <button
            onClick={() => navigate('/register')}
            className="w-10 h-10 rounded-full bg-white border border-surface-border grid place-items-center hover:bg-paddy/5 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-paddy">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-full bg-paddy grid place-items-center mb-4"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 6C18 6 12 14 12 20C12 23.31 14.69 26 18 26C21.31 26 24 23.31 24 20C24 14 18 6 18 6Z" stroke="#E3A008" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M18 26V32" stroke="#E3A008" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14 30H22" stroke="#E3A008" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-3xl font-bold tracking-wide text-paddy">{t('appName')}</h1>
        <p className="text-text-muted text-sm mt-1 text-center">{t('buyer.tagline')}</p>

        {/* Language toggle */}
        <div className="mt-4">
          <LanguageToggle light />
        </div>

        {/* Form header */}
        <h2 className="font-display text-xl font-bold text-paddy mt-8 mb-6 self-start">{t('auth.buyerRegistration')}</h2>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <div>
            <label className="label-muted" htmlFor="company_name">{t('auth.companyName')}</label>
            <input
              id="company_name"
              placeholder="e.g., Lanka Organics Ltd"
              className={`input-field ${errors.company_name ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('company_name')}
            />
            {errors.company_name && <p className="text-clay text-xs mt-1">{errors.company_name.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="email">{t('auth.emailAddress')}</label>
            <input
              id="email"
              type="email"
              placeholder="e.g., harsha@agri.lk"
              className={`input-field ${errors.email ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('email')}
            />
            {errors.email && <p className="text-clay text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="phone">{t('auth.phoneNumber')}</label>
            <input
              id="phone"
              type="tel"
              placeholder="+94 77 123 4567"
              className={`input-field ${errors.phone ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('phone')}
            />
            {errors.phone && <p className="text-clay text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-muted" htmlFor="password">{t('auth.password')}</label>
              <PasswordInput
                id="password"
                placeholder="Minimum 8 characters"
                {...registerField('password')}
              />
              {errors.password && <p className="text-clay text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label-muted" htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <PasswordInput
                id="confirmPassword"
                placeholder={t('auth.confirmPassword')}
                {...registerField('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-clay text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <label className="label-muted" htmlFor="company_location">{t('auth.companyLocation')}</label>
            <input
              id="company_location"
              placeholder="e.g., Mihintale Road, Anuradhapura"
              className={`input-field ${errors.company_location ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('company_location')}
            />
            {errors.company_location && <p className="text-clay text-xs mt-1">{errors.company_location.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="region">{t('auth.region')}</label>
            <select
              id="region"
              className={`input-field ${errors.region ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('region')}
            >
              <option value="">{t('auth.select')}</option>
              {SRI_LANKA_DISTRICTS.map((r) => (
                <option key={r} value={r}>{t('regions.' + r, r)}</option>
              ))}
            </select>
            {errors.region && <p className="text-clay text-xs mt-1">{errors.region.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="delivery_address">{t('auth.deliveryAddress')}</label>
            <input
              id="delivery_address"
              placeholder="e.g., Baseline Road, Colombo 09"
              className={`input-field ${errors.delivery_address ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('delivery_address')}
            />
            {errors.delivery_address && <p className="text-clay text-xs mt-1">{errors.delivery_address.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="delivery_address_2">{t('auth.deliveryAddress2')}</label>
            <input
              id="delivery_address_2"
              placeholder="e.g., Nugegoda Road, Colombo 07"
              className="input-field"
              {...registerField('delivery_address_2')}
            />
          </div>

          <div>
            <label className="label-muted" htmlFor="lang">{t('auth.language')}</label>
            <select id="lang" className="input-field" {...registerField('preferred_language')}>
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>

          {error && (
            <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button type="submit" loading={loading} variant="turmeric" className="w-full">
            {t('auth.submit')}
          </Button>
        </form>

        {/* Sign in link */}
        <p className="mt-6 text-sm text-text-muted">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>

    </div>
  )
}
