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

const officerSchema = z.object({
  officer_name: z.string().min(2, 'Officer name must be at least 2 characters'),
  officer_id: z.string().min(1, 'Officer ID is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required').regex(
    /^(\+94|94|0)?[1-9]\d{8}$/,
    'Enter a valid Sri Lankan phone number'
  ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  department: z.string().min(1, 'Department is required'),
  district: z.string().min(1, 'District is required'),
  designation: z.string().min(1, 'Designation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function OfficerRegister() {
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
    resolver: zodResolver(officerSchema),
    defaultValues: {
      officer_name: '',
      officer_id: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      department: '',
      district: '',
      designation: '',
    },
  })

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  async function onSubmit(data) {
    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      const body = {
        name: data.officer_name,
        email: data.email,
        password: data.password,
        role: 'officer',
        region: data.district,
        phone: data.phone,
        officer_id: data.officer_id,
        department: data.department,
        district: data.district,
        designation: data.designation,
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
        <p className="text-text-muted text-sm mt-1 text-center">{t('officer.tagline')}</p>

        {/* Language toggle */}
        <div className="mt-4">
          <LanguageToggle light />
        </div>

        {/* Form header */}
        <h2 className="font-display text-xl font-bold text-paddy mt-8 mb-6 self-start">{t('auth.officerRegistration')}</h2>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <div>
            <label className="label-muted" htmlFor="officer_name">{t('auth.officerName')}</label>
            <input
              id="officer_name"
              placeholder="e.g., Kumar Perera"
              className={`input-field ${errors.officer_name ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('officer_name')}
            />
            {errors.officer_name && <p className="text-clay text-xs mt-1">{errors.officer_name.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="officer_id">{t('auth.officerId')}</label>
            <input
              id="officer_id"
              placeholder="e.g., AG/OF/2026/894"
              className={`input-field ${errors.officer_id ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('officer_id')}
            />
            {errors.officer_id && <p className="text-clay text-xs mt-1">{errors.officer_id.message}</p>}
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
            <label className="label-muted" htmlFor="department">{t('auth.department')}</label>
            <input
              id="department"
              placeholder="e.g., Agrarian Development Dept"
              className={`input-field ${errors.department ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('department')}
            />
            {errors.department && <p className="text-clay text-xs mt-1">{errors.department.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="district">{t('auth.district')}</label>
            <select
              id="district"
              className={`input-field ${errors.district ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('district')}
            >
              <option value="">{t('auth.select')}</option>
              {SRI_LANKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{t('regions.' + d, d)}</option>
              ))}
            </select>
            {errors.district && <p className="text-clay text-xs mt-1">{errors.district.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="designation">{t('auth.designation')}</label>
            <input
              id="designation"
              placeholder="e.g., Regional Field Officer"
              className={`input-field ${errors.designation ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('designation')}
            />
            {errors.designation && <p className="text-clay text-xs mt-1">{errors.designation.message}</p>}
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
