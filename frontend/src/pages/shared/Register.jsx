import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sprout, Building2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'
import LanguageToggle from '../../components/layout/LanguageToggle.jsx'

const ROLES = [
  {
    value: 'farmer',
    icon: Sprout,
    labelKey: 'roles.farmer',
    descKey: 'roleDesc.farmer',
    iconBg: 'bg-paddy',
  },
  {
    value: 'buyer',
    icon: Building2,
    labelKey: 'roles.buyer',
    descKey: 'roleDesc.buyer',
    iconBg: 'bg-turmeric',
  },
  {
    value: 'officer',
    icon: ShieldCheck,
    labelKey: 'roles.officer',
    descKey: 'roleDesc.officer',
    iconBg: 'bg-paddy',
  },
]

export default function Register() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedRole = location.state?.selectedRole || null

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  function handleRoleClick(role) {
    const routes = {
      farmer: '/register/farmer',
      buyer: '/register/buyer',
      officer: '/register/officer',
    }
    navigate(routes[role])
  }

  return (
    <div className="min-h-dvh flex flex-col items-center bg-cream">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 w-full max-w-lg mx-auto">
        {/* Language toggle */}
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>

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
          {t('appName')}
        </h1>
        <p className="text-text-muted text-sm mt-4 text-center max-w-xs">
          {t('auth.chooseProfile')}
        </p>

        {/* Role cards */}
        <div className="w-full space-y-3 mt-6">
          {ROLES.map(({ value, icon: Icon, labelKey, descKey, iconBg }, i) => (
            <motion.button
              key={value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleRoleClick(value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border bg-white hover:shadow-card transition text-left ${
                preselectedRole === value
                  ? 'border-paddy shadow-card'
                  : 'border-surface-border hover:border-paddy/40'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} grid place-items-center shrink-0`}>
                <Icon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-paddy text-sm">{t(labelKey)}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(descKey)}</p>
              </div>
              {preselectedRole === value && (
                <div className="w-6 h-6 rounded-full bg-paddy grid place-items-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full mt-8"
        >
          <button
            onClick={() => {
              if (preselectedRole) handleRoleClick(preselectedRole)
            }}
            className={`w-full rounded-xl px-4 py-3 font-display font-semibold text-sm text-white transition ${
              preselectedRole
                ? 'bg-turmeric hover:brightness-110 active:scale-[0.98]'
                : 'bg-turmeric/50 cursor-not-allowed'
            }`}
            disabled={!preselectedRole}
          >
            {t('auth.continue')}
          </button>
        </motion.div>

        {/* Sign in link */}
        <p className="mt-6 text-sm text-text-muted">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link
            to="/login"
            className="font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
          >
            {t('auth.signIn')}
          </Link>
        </p>
      </div>

    </div>
  )
}
