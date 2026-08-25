import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Leaf, ScanLine, FileSignature, WifiOff, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../../components/common/Button.jsx'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'

const DEMOS = [
  { role: 'farmer', labelKey: 'roles.farmer', email: 'farmer@demo.lk' },
  { role: 'buyer', labelKey: 'roles.buyer', email: 'buyer@demo.lk' },
  { role: 'officer', labelKey: 'roles.officer', email: 'officer@demo.lk' },
]

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+94|94|0)?[1-9]\d{8}$/,
      'Enter a valid Sri Lankan phone number (e.g. +94 77 123 4567)'
    ),
})

export default function Login() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  function onPhoneSubmit(data) {
    setPhone(data.phone)
    setStep('otp')
  }

  function handleOtpInput(index, value) {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  async function doLogin(em, pw) {
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

  async function handleOtpVerify() {
    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit code')
      return
    }
    const phoneMap = {
      '077': 'farmer@demo.lk',
      '071': 'buyer@demo.lk',
      '076': 'officer@demo.lk',
    }
    const prefix = phone.slice(0, 3)
    const email = phoneMap[prefix] || 'farmer@demo.lk'
    await doLogin(email, 'demo1234')
  }

  function handleDemoLogin(email) {
    doLogin(email, 'demo1234')
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-paddy text-cream overflow-hidden">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-turmeric/15 blur-2xl" />
        <div className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="w-10 h-10 rounded-xl bg-turmeric grid place-items-center">
            <Leaf size={20} className="text-white" />
          </span>
          CropContract
        </div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-bold leading-[1.05] max-w-md text-white"
          >
            Know demand before you plant.
          </motion.h1>
          <ul className="mt-8 space-y-3 text-sm font-medium max-w-sm text-cream/90">
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
        <p className="text-xs font-semibold opacity-60">MB SPARTANS · Project Nova · Saegis Campus</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 bg-cream">
        <div className="lg:hidden flex items-center gap-2 font-display font-bold text-lg mb-10">
          <span className="w-9 h-9 rounded-xl bg-paddy grid place-items-center">
            <Leaf size={17} className="text-turmeric" />
          </span>
          CropContract
        </div>

        <h2 className="font-display text-3xl font-bold text-paddy">{t('auth.welcomeBack')}</h2>
        <p className="text-text-muted mt-1 mb-8 text-sm">{t('tagline')}</p>

        {step === 'phone' ? (
          <form onSubmit={handleSubmit(onPhoneSubmit)} className="space-y-4">
            <div>
              <label className="label-muted" htmlFor="phone">{t('auth.phone')}</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className={`input-field ${errors.phone ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
                placeholder="+94 77 123 4567"
                {...register('phone')}
              />
              {errors.phone && <p className="text-clay text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <Button type="submit" className="w-full">
              {t('auth.otpSent') || 'Send OTP'} <ChevronRight size={16} />
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Enter the 6-digit code sent to <span className="font-semibold text-paddy">{phone}</span>
            </p>
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="input-field w-12 h-14 text-center text-xl font-bold"
                />
              ))}
            </div>

            {error && (
              <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <Button onClick={handleOtpVerify} loading={loading} className="w-full">
              {t('auth.signIn')}
            </Button>

            <button
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError('') }}
              className="text-sm text-text-muted hover:text-paddy text-center w-full"
            >
              ← Change phone number
            </button>
          </div>
        )}

        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2.5">
            {t('auth.demoAccounts')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMOS.map((d) => (
              <button
                key={d.role}
                onClick={() => handleDemoLogin(d.email)}
                disabled={loading}
                className="btn-outline !px-2 !py-2 text-xs"
              >
                {t(d.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm text-text-muted text-center">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-paddy hover:text-turmeric transition">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
