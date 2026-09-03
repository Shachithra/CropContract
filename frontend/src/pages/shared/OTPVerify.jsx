import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'

export default function OTPVerify() {
  const { user, verifyOtp } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { phone, role } = location.state || {}
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePathFor(user.role)} replace />
  if (!phone || !role) {
    return <Navigate to="/login" replace />
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

  async function handleVerify() {
    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit code')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      await verifyOtp(api, phone, otpCode)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Invalid OTP — please try again')
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
            onClick={() => window.history.back()}
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

        {/* OTP input */}
        <div className="w-full mt-10">
          <label className="label-muted">Enter 6-digit code</label>
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
        </div>

        {error && (
          <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5 mt-4 w-full">
            {error}
          </p>
        )}

        {/* Verify button */}
        <div className="w-full mt-6">
          <Button onClick={handleVerify} loading={loading} variant="turmeric" className="w-full">
            Log In
          </Button>
        </div>

        <p className="mt-6 text-sm text-text-muted">
          <button
            onClick={() => navigate('/register')}
            className="font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
          >
            New farmer? Register
          </button>
        </p>

        <p className="mt-auto pt-8 text-[11px] text-text-muted/60 text-center">
          You can login in while offline. Your details sync once you're back online.
        </p>
      </div>
    </div>
  )
}
