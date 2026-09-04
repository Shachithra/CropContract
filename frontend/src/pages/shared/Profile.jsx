import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.jsx'
import { showToast } from '../../components/common/Toast.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'
import { ALL_CROPS } from '../../lib/sriLankaCrops.js'
import { compressImage } from '../../lib/imageCompress.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import api from '../../lib/api.js'
import ReviewList from '../../components/common/ReviewList.jsx'

import { useQuery } from '@tanstack/react-query'

export default function Profile() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const modalFileRef = useRef(null)

  const { data: reviewStats } = useQuery({
    queryKey: ['reviewStats', user?._id || user?.id],
    queryFn: async () => {
      const userId = user?._id || user?.id
      if (!userId) return null
      const { data } = await api.get(`/reviews/stats/${userId}`)
      return data
    },
    enabled: !!(user?._id || user?.id),
  })

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingPicture, setPendingPicture] = useState(undefined)
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    region: user?.region || '',
    farm_location: user?.farm_location || '',
    crop_types: Array.isArray(user?.crop_types) ? user.crop_types.join(', ') : (user?.crop_types || ''),
    company_name: user?.company_name || '',
    company_location: user?.company_location || '',
    delivery_address: user?.delivery_address || '',
    delivery_address_2: user?.delivery_address_2 || '',
    department: user?.department || '',
    district: user?.district || '',
    designation: user?.designation || '',
  }))

  if (!user) return null

  const cropTypes = user.crop_types
    ? typeof user.crop_types === 'string'
      ? user.crop_types.split(',').map((c) => c.trim()).filter(Boolean)
      : Array.isArray(user.crop_types)
        ? user.crop_types
        : []
    : []

  function openEdit() {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      region: user?.region || '',
      farm_location: user?.farm_location || '',
      crop_types: Array.isArray(user?.crop_types) ? user.crop_types.join(', ') : (user?.crop_types || ''),
      company_name: user?.company_name || '',
      company_location: user?.company_location || '',
      delivery_address: user?.delivery_address || '',
      delivery_address_2: user?.delivery_address_2 || '',
      department: user?.department || '',
      district: user?.district || '',
      designation: user?.designation || '',
    })
    setPendingPicture(undefined)
    setEditing(true)
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handlePictureChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast(t('common.imageTooLarge'), 'error')
      return
    }
    try {
      const compressed = await compressImage(file, { maxDim: 512, quality: 0.8 })
      const reader = new FileReader()
      reader.onload = () => {
        setPendingPicture(reader.result)
      }
      reader.readAsDataURL(compressed)
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  function removePicture() {
    setPendingPicture(null)
  }

  async function handleSave() {
    if (!form.name || form.name.length < 2) {
      showToast(t('common.nameRequired'), 'error')
      return
    }
    setSaving(true)
    try {
      const body = { ...form }
      if (pendingPicture !== undefined) {
        body.profile_picture = pendingPicture
      }
      await api.put('/auth/profile', body)
      localStorage.setItem('cc_user', JSON.stringify({ ...user, ...body }))
      window.dispatchEvent(new Event('cc_user_updated'))
      setEditing(false)
      setPendingPicture(undefined)
      showToast(t('common.profileUpdated'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'si', label: 'සිංහල' },
    { code: 'ta', label: 'தமிழ்' },
  ]

  return (
    <div className="min-h-dvh bg-cream">
      {/* Header */}
      <div className="w-full max-w-md mx-auto px-6 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold tracking-wide text-paddy text-center">{t('appName')}</h1>
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
        </motion.div>

        {/* Name */}
        <h2 className="font-display text-xl font-bold text-paddy">{user.name}</h2>

        {/* Role badge */}
        <span className="mt-2 inline-block px-4 py-1 rounded-full bg-paddy text-white text-xs font-bold tracking-wider">
          {t(`common.${user.role}`) || user.role?.toUpperCase()}
        </span>

        {/* User ID */}
        {user.user_id && (
          <p className="mt-1.5 text-xs text-text-muted font-mono">{user.user_id}</p>
        )}

        {/* Info card */}
        <div className="w-full mt-6 bg-white rounded-2xl border border-surface-border p-5 space-y-4 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-4 md:space-y-0">
          {/* Officer fields - shown first for officers */}
          {user.role === 'officer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.officerId')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.officer_id || '—'}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.emailAddress')}</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{user.email || '—'}</p>
          </div>

          {/* Phone */}
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.phoneLabel')}</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{user.phone || '—'}</p>
          </div>

          {/* Department (officer only) */}
          {user.role === 'officer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.departmentLabel')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.department || '—'}</p>
            </div>
          )}

          {/* District / Region (officer only) */}
          {user.role === 'officer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.districtRegion')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.district || t(`regions.${user.region}`, { defaultValue: user.region || '—' })}</p>
            </div>
          )}

          {/* Designation (officer only) */}
          {user.role === 'officer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.designationLabel')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.designation || '—'}</p>
            </div>
          )}

          {/* Farm Location (farmer only) */}
          {user.role === 'farmer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.farmLocationLabel')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.farm_location || '—'}</p>
            </div>
          )}

          {/* Company Location (buyer only) */}
          {user.role === 'buyer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.companyLocationLabel')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.company_location || '—'}</p>
            </div>
          )}

          {/* Sourcing Region (buyer only) */}
          {user.role === 'buyer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.sourcingRegion')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{t(`regions.${user.region}`, { defaultValue: user.region || '—' })}</p>
            </div>
          )}

          {/* Delivery Address (buyer only) */}
          {user.role === 'buyer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.deliveryAddress')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.delivery_address || '—'}</p>
            </div>
          )}

          {/* Delivery Address 2 (buyer only) */}
          {user.role === 'buyer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.deliveryAddress2')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{user.delivery_address_2 || '—'}</p>
            </div>
          )}

          {/* Region (farmer/buyer) */}
          {user.role !== 'officer' && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.regionLabel')}</p>
              <p className="text-sm font-medium text-paddy mt-0.5">{t(`regions.${user.region}`, { defaultValue: user.region || '—' })}</p>
            </div>
          )}

          {/* Crop Types (farmer only) */}
          {user.role === 'farmer' && cropTypes.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.cropTypesLabel')}</p>
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
          )}
        </div>

        {/* Edit Profile + Log Out buttons */}
        <div className="w-full mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={openEdit}
            className="flex-1 py-3 rounded-2xl border-2 border-paddy text-paddy font-display font-bold text-sm hover:bg-paddy/5 active:scale-[0.98] transition"
          >
            {t('common.editProfile')}
          </button>
          <button
            onClick={() => { logout(); window.location.href = '/login' }}
            className="flex-1 py-3 rounded-2xl text-clay font-display font-bold text-sm hover:underline active:scale-[0.98] transition"
          >
            {t('common.logOut')}
          </button>
        </div>

        {/* Reviews section */}
        {(user.role === 'farmer' || user.role === 'buyer') && (
          <div className="w-full mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-paddy">{t('review.reviews')}</h3>
              {reviewStats && reviewStats.total_reviews > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-turmeric text-turmeric" />
                  <span className="text-xs font-semibold text-paddy">{reviewStats.avg_rating}</span>
                  <span className="text-[10px] text-text-muted">({reviewStats.total_reviews})</span>
                </div>
              )}
            </div>
            <ReviewList userId={user._id || user.id} />
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setEditing(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-cream rounded-t-3xl max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-cream px-6 pt-6 pb-4 border-b border-surface-border z-10">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-paddy">{t('common.editProfile')}</h2>
                  <button
                    onClick={() => setEditing(false)}
                    className="w-8 h-8 rounded-full bg-surface-border/30 grid place-items-center hover:bg-surface-border/50 transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {pendingPicture !== undefined ? (
                      pendingPicture ? (
                        <img
                          src={pendingPicture}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-paddy/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-paddy/10 border-2 border-paddy/20 grid place-items-center">
                          <span className="text-paddy font-display font-bold text-xl">{user.name?.[0] || '?'}</span>
                        </div>
                      )
                    ) : user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-paddy/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-paddy/10 border-2 border-paddy/20 grid place-items-center">
                        <span className="text-paddy font-display font-bold text-xl">{user.name?.[0] || '?'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => modalFileRef.current?.click()}
                      className="px-3 py-1.5 rounded-full bg-turmeric text-paddy text-xs font-semibold hover:brightness-110 transition"
                    >
                      {t('common.changePhoto')}
                    </button>
                    {user.profile_picture && pendingPicture !== null && (
                      <button
                        onClick={removePicture}
                        className="px-3 py-1.5 rounded-full bg-clay/15 text-clay text-xs font-semibold hover:bg-clay/25 transition"
                      >
                        {t('common.remove')}
                      </button>
                    )}
                    {pendingPicture !== undefined && (
                      <button
                        onClick={() => setPendingPicture(undefined)}
                        className="px-3 py-1.5 rounded-full bg-surface-border/50 text-text-muted text-xs font-semibold hover:bg-surface-border/75 transition"
                      >
                        {t('common.undo')}
                      </button>
                    )}
                  </div>
                  <input
                    ref={modalFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePictureChange}
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.nameField')}</label>
                  <input
                    className="input-field mt-1"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.emailField')}</label>
                  <input
                    type="email"
                    className="input-field mt-1"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.phoneField')}</label>
                  <input
                    type="tel"
                    maxLength={13}
                    className="input-field mt-1"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.regionField')}</label>
                  <select
                    className="input-field mt-1"
                    value={form.region}
                    onChange={(e) => updateField('region', e.target.value)}
                  >
                    <option value="">{t('auth.select')}</option>
                    {SRI_LANKA_DISTRICTS.map((r) => (
                      <option key={r} value={r}>{t('regions.' + r, r)}</option>
                    ))}
                  </select>
                </div>

                {/* Farmer fields */}
                {user.role === 'farmer' && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.farmLocationField')}</label>
                      <input
                        className="input-field mt-1"
                        value={form.farm_location}
                        onChange={(e) => updateField('farm_location', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.cropTypesField')}</label>
                      <select
                        className="input-field mt-1"
                        value={form.crop_types}
                        onChange={(e) => updateField('crop_types', e.target.value)}
                      >
                        <option value="">{t('auth.select')}</option>
                        {ALL_CROPS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Buyer fields */}
                {user.role === 'buyer' && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.companyLocationField')}</label>
                      <input
                        className="input-field mt-1"
                        value={form.company_location}
                        onChange={(e) => updateField('company_location', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.deliveryAddressField')}</label>
                      <input
                        className="input-field mt-1"
                        value={form.delivery_address}
                        onChange={(e) => updateField('delivery_address', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.deliveryAddress2Field')}</label>
                      <input
                        className="input-field mt-1"
                        value={form.delivery_address_2}
                        onChange={(e) => updateField('delivery_address_2', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Officer fields */}
                {user.role === 'officer' && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.departmentField')}</label>
                      <input
                        className="input-field mt-1"
                        value={form.department}
                        onChange={(e) => updateField('department', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.districtField')}</label>
                      <select
                        className="input-field mt-1"
                        value={form.district}
                        onChange={(e) => updateField('district', e.target.value)}
                      >
                        <option value="">{t('auth.select')}</option>
                        {SRI_LANKA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{t('regions.' + d, d)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.designationField')}</label>
                      <input
                        className="input-field mt-1"
                        value={form.designation}
                        onChange={(e) => updateField('designation', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-cream px-6 py-4 border-t border-surface-border">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 rounded-2xl bg-turmeric text-paddy font-display font-bold text-sm hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {saving ? t('common.saving') : t('common.saveChanges')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
