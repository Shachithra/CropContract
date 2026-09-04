import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import BanCountdown from '../../components/common/BanCountdown.jsx'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required').regex(
    /^(\+94|94|0)?[1-9]\d{8}$/,
    'Enter a valid Sri Lankan phone number'
  ),
  password: z.string().min(1, 'Password is required'),
})

export default function FarmerLogin() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [banData, setBanData] = useState(null)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  // Show ban screen
  if (banData) {
    return (
      <div className="min-h-dvh flex flex-col items-center bg-cream">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 w-full max-w-md">
          <div className="w-24 h-24 rounded-full bg-clay/15 grid place-items-center mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-clay">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-clay mb-2">
            {banData.ban_type === 'permanent' ? t('ban.permBan') : t('ban.tempBan')}
          </h1>
          {banData.reason && (
            <p className="text-sm text-text-muted mb-4 text-center">{t('ban.banReason', { reason: banData.reason })}</p>
          )}
          {banData.ban_type === 'temporary' && banData.banned_until && (
            <div className="space-y-4 mb-6">
              <p className="text-sm text-text-muted text-center">{t('ban.timeRemaining')}</p>
              <BanCountdown bannedUntil={banData.banned_until} />
            </div>
          )}
          {banData.ban_type === 'permanent' && (
            <div className="bg-clay/10 border border-clay/20 rounded-xl px-4 py-3 mb-6 max-w-sm">
              <p className="text-sm text-clay text-center">{t('ban.permanentlyBanned')}</p>
            </div>
          )}
          <button
            onClick={() => setBanData(null)}
            className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    )
  }

  async function onSubmit(data) {
    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      const response = await api.post('/auth/login', {
        phone: data.phone,
        password: data.password,
      })

      // Check if banned
      if (response.data.banned) {
        setBanData(response.data.ban_info)
        return
      }

      // Navigate to OTP page with phone and role
      navigate('/login/otp', {
        state: {
          phone: response.data.phone,
          role: response.data.role,
        },
      })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Login failed — check your credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center bg-cream">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pb-8 w-full max-w-md">
        {/* Back button */}
        <div className="w-full flex justify-start mb-4 pt-4">
          <button
            onClick={() => navigate('/login')}
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
        <p className="text-text-muted text-sm mt-1 text-center">{t('tagline')}</p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 mt-10">
          <div>
            <label className="label-muted" htmlFor="phone">{t('auth.phoneNumber')}</label>
            <input
              id="phone"
              type="tel"
              placeholder="07X XXX XXXX"
              className={`input-field ${errors.phone ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('phone')}
            />
            {errors.phone && <p className="text-clay text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label-muted" htmlFor="password">{t('auth.passwordLabel')}</label>
            <PasswordInput
              id="password"
              placeholder={t('auth.enterPassword')}
              {...registerField('password')}
            />
            {errors.password && <p className="text-clay text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && (
            <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button type="submit" loading={loading} variant="turmeric" className="w-full">
            {t('auth.getOtp')}
          </Button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-sm text-text-muted">
          <button
            onClick={() => navigate('/register')}
            className="font-semibold text-paddy underline underline-offset-4 decoration-1 hover:text-turmeric transition"
          >
            {t('auth.registerAs')}
          </button>
        </p>

        <p className="mt-auto pt-8 text-[11px] text-text-muted/60 text-center">
          {t('auth.offlineLogin')}
        </p>
      </div>
    </div>
  )
}
