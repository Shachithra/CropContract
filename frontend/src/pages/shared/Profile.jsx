import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.jsx'
import { showToast } from '../../components/common/Toast.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'
import { ALL_CROPS } from '../../lib/sriLankaCrops.js'
import { motion } from 'framer-motion'
import api from '../../lib/api.js'

export default function Profile() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const fileInputRef = useRef(null)

  if (!user) return null

  const cropTypes = user.crop_types
    ? typeof user.crop_types === 'string'
      ? user.crop_types.split(',').map((c) => c.trim()).filter(Boolean)
      : Array.isArray(user.crop_types)
        ? user.crop_types
        : []
    : []

  function handlePictureChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await api.put('/auth/profile', { profile_picture: reader.result })
        showToast('Profile picture updated', 'success')
        window.location.reload()
      } catch {
        showToast(t('common.error'), 'error')
      }
    }
    reader.readAsDataURL(file)
  }

  const roleLabel = {
    farmer: 'FARMER',
    buyer: 'BUYER',
    officer: 'OFFICER',
  }

  return (
    <div className="min-h-dvh bg-cream">
      {/* Header */}
      <div className="w-full max-w-md mx-auto px-6 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold tracking-wide text-paddy text-center">CROPCONTRACT</h1>
      </div>

      <div className="flex flex-col items-center px-6 pb-8 w-full max-w-md mx-auto">
        {/* Profile picture */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative mb-3"
        >
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-paddy/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-paddy/10 border-4 border-paddy/20 grid place-items-center">
              <span className="text-paddy font-display font-bold text-3xl">{user.name?.[0] || '?'}</span>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-turmeric grid place-items-center border-2 border-white shadow-md hover:brightness-110 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePictureChange}
          />
        </motion.div>

        {/* Name */}
        <h2 className="font-display text-xl font-bold text-paddy">{user.name}</h2>

        {/* Role badge */}
        <span className="mt-2 inline-block px-4 py-1 rounded-full bg-paddy text-white text-xs font-bold tracking-wider">
          {roleLabel[user.role] || user.role?.toUpperCase()}
        </span>

        {/* Info card */}
        <div className="w-full mt-6 bg-white rounded-2xl border border-surface-border p-5 space-y-4">
          {/* Email */}
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Email Address</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{user.email || '—'}</p>
          </div>

          <div className="border-t border-surface-border/60" />

          {/* Phone */}
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Phone Number</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{user.phone || '—'}</p>
          </div>

          {/* Farm Location (farmer only) */}
          {user.role === 'farmer' && user.farm_location && (
            <>
              <div className="border-t border-surface-border/60" />
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Farm Location</p>
                <p className="text-sm font-medium text-paddy mt-0.5">{user.farm_location}</p>
              </div>
            </>
          )}

          {/* Company (buyer only) */}
          {user.role === 'buyer' && user.company_name && (
            <>
              <div className="border-t border-surface-border/60" />
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Company</p>
                <p className="text-sm font-medium text-paddy mt-0.5">{user.company_name}</p>
              </div>
            </>
          )}

          {/* Officer ID (officer only) */}
          {user.role === 'officer' && user.officer_id && (
            <>
              <div className="border-t border-surface-border/60" />
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Officer ID</p>
                <p className="text-sm font-medium text-paddy mt-0.5">{user.officer_id}</p>
              </div>
            </>
          )}

          {/* Region */}
          <div className="border-t border-surface-border/60" />
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Region</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{t(`regions.${user.region}`, { defaultValue: user.region || '—' })}</p>
          </div>

          {/* Crop Types (farmer only) */}
          {user.role === 'farmer' && cropTypes.length > 0 && (
            <>
              <div className="border-t border-surface-border/60" />
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Crop Types</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cropTypes.map((crop) => (
                    <span
                      key={crop}
                      className="px-3 py-1 rounded-full bg-paddy text-white text-xs font-semibold"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Edit Profile button */}
        <button className="w-full mt-6 py-3 rounded-2xl border-2 border-paddy text-paddy font-display font-bold text-sm hover:bg-paddy/5 active:scale-[0.98] transition">
          Edit Profile
        </button>

        {/* Log Out */}
        <button
          onClick={() => { logout(); window.location.href = '/login' }}
          className="mt-4 text-clay font-display font-semibold text-sm hover:underline active:scale-[0.98] transition"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
