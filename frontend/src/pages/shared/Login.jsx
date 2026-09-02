import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sprout, Building2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'

const ROLES = [
  {
    value: 'farmer',
    icon: Sprout,
    label: 'Farmer / Grower',
    description: 'Secure guaranteed pricing, log yields, and manage crop contracts.',
    iconBg: 'bg-paddy',
  },
  {
    value: 'buyer',
    icon: Building2,
    label: 'Buyer / Agri-Business',
    description: 'Source certified quality produce, issue contracts, and track supply.',
    iconBg: 'bg-turmeric',
  },
  {
    value: 'officer',
    icon: ShieldCheck,
    label: 'Agricultural Officer',
    description: 'Validate crop health scans, issue local risk alerts, and support growers.',
    iconBg: 'bg-paddy',
  },
]

export default function Login() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  function handleRoleClick(role) {
    const routes = {
      farmer: '/login/farmer',
      buyer: '/login/buyer',
      officer: '/login/officer',
    }
    navigate(routes[role])
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-full bg-paddy grid place-items-center mb-6"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M18 6C18 6 12 14 12 20C12 23.31 14.69 26 18 26C21.31 26 24 23.31 24 20C24 14 18 6 18 6Z"
              stroke="#E3A008"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M18 26V32"
              stroke="#E3A008"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M14 30H22"
              stroke="#E3A008"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-3xl font-bold tracking-wide text-paddy">
          CROPCONTRACT
        </h1>
        <p className="text-text-muted text-sm mt-2 text-center max-w-xs">
          Know Demand. Secure Contracts. Grow with Confidence.
        </p>

        {/* Login as */}
        <h2 className="font-display text-xl font-bold text-paddy mt-10 mb-5 self-start">
          Login as
        </h2>

        {/* Role cards */}
        <div className="w-full space-y-3">
          {ROLES.map(({ value, icon: Icon, label, description, iconBg }, i) => (
            <motion.button
              key={value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleRoleClick(value)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-surface-border bg-white hover:border-paddy/40 hover:shadow-card transition text-left"
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} grid place-items-center shrink-0`}>
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-paddy text-sm">{label}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Register link */}
        <p className="mt-10 text-sm text-text-muted">
          <Link
            to="/register"
            className="font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
          >
            Register
          </Link>
        </p>
      </div>

      {/* Home indicator */}
      <div className="w-full flex justify-center pb-4">
        <div className="w-36 h-1.5 bg-paddy rounded-full" />
      </div>
    </div>
  )
}
