import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
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

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  async function onSubmit(data) {
    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      const response = await api.post('/auth/login', {
        phone: data.phone,
        password: data.password,
      })
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
      {/* Status bar */}
      <div className="w-full max-w-md px-6 pt-12 pb-4 flex items-center justify-between text-xs text-text-muted">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pb-8 w-full max-w-md">
        {/* Back button */}
        <div className="w-full flex justify-start mb-4">
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
        <h1 className="font-display text-3xl font-bold tracking-wide text-paddy">CROPCONTRACT</h1>
        <p className="text-text-muted text-sm mt-1 text-center">Know Demand. Secure Contracts. Grow with Confidence.</p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 mt-10">
          <div>
            <label className="label-muted" htmlFor="phone">PHONE NUMBER</label>
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
            <label className="label-muted" htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              placeholder="Enter Your Password"
              className={`input-field ${errors.password ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('password')}
            />
            {errors.password && <p className="text-clay text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && (
            <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button type="submit" loading={loading} variant="turmeric" className="w-full">
            Login
          </Button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-sm text-text-muted">
          Register
        </p>
      </div>

      {/* Home indicator */}
      <div className="w-full flex justify-center pb-4">
        <div className="w-36 h-1.5 bg-paddy rounded-full" />
      </div>
    </div>
  )
}
