import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.jsx'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { showToast } from '../../components/common/Toast.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'
import { ALL_CROPS } from '../../lib/sriLankaCrops.js'
import { Camera, LogOut, Shield, User, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../../lib/api.js'

export default function Profile() {
  const { t } = useTranslation()
  const { user, logout, updateProfile, changePassword } = useAuth()
  const fileInputRef = useRef(null)

  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    region: user?.region || '',
    preferred_language: user?.preferred_language || 'en',
    farm_location: user?.farm_location || '',
    crop_types: user?.crop_types || '',
    company_name: user?.company_name || '',
    company_location: user?.company_location || '',
    delivery_address: user?.delivery_address || '',
    department: user?.department || '',
    district: user?.district || '',
    designation: user?.designation || '',
  })
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })

  if (!user) return null

  function handlePictureChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result
      try {
        await updateProfile(api, { profile_picture: base64 })
        showToast('Profile picture updated', 'success')
      } catch {
        showToast(t('common.error'), 'error')
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile() {
    if (!form.name || form.name.length < 2) {
      showToast('Name must be at least 2 characters', 'error')
      return
    }
    setSaving(true)
    try {
      await updateProfile(api, form)
      setEditing(false)
      showToast('Profile updated', 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!pwForm.current || !pwForm.new) {
      showToast('Fill in all password fields', 'error')
      return
    }
    if (pwForm.new.length < 6) {
      showToast('New password must be at least 6 characters', 'error')
      return
    }
    if (pwForm.new !== pwForm.confirm) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSaving(true)
    try {
      await changePassword(api, pwForm.current, pwForm.new)
      setChangingPassword(false)
      setPwForm({ current: '', new: '', confirm: '' })
      showToast('Password changed successfully', 'success')
    } catch (err) {
      const detail = err.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'Failed to change password', 'error')
    } finally {
      setSaving(false)
    }
  }

  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'si', label: 'සිංහල' },
    { code: 'ta', label: 'தமிழ்' },
  ]

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-paddy">{t('nav.profile')}</h1>

      {/* Profile picture + name */}
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-surface-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-paddy grid place-items-center">
                <span className="text-turmeric font-display font-bold text-3xl">{user.name?.[0] || '?'}</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-turmeric grid place-items-center border-2 border-white shadow-sm hover:brightness-110 transition"
            >
              <Camera size={13} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePictureChange}
            />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-lg text-paddy">{user.name}</p>
            <p className="text-sm text-text-muted">{t(`roles.${user.role}`)}</p>
          </div>
        </div>
      </Card>

      {/* Personal details */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-display font-bold text-sm text-paddy flex items-center gap-2">
            <User size={15} className="text-turmeric" /> Personal Details
          </p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-turmeric hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div>
              <label className="label-muted">NAME</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label-muted">EMAIL</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div>
              <label className="label-muted">PHONE</label>
              <input
                type="tel"
                className="input-field"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label-muted">REGION</label>
              <select
                className="input-field"
                value={form.region}
                onChange={(e) => updateField('region', e.target.value)}
              >
                {SRI_LANKA_DISTRICTS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-muted">LANGUAGE</label>
              <select
                className="input-field"
                value={form.preferred_language}
                onChange={(e) => updateField('preferred_language', e.target.value)}
              >
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>

            {/* Role-specific fields */}
            {user.role === 'farmer' && (
              <>
                <div>
                  <label className="label-muted">FARM LOCATION</label>
                  <input
                    className="input-field"
                    value={form.farm_location}
                    onChange={(e) => updateField('farm_location', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-muted">CROP TYPES</label>
                  <select
                    className="input-field"
                    value={form.crop_types}
                    onChange={(e) => updateField('crop_types', e.target.value)}
                  >
                    <option value="">Select</option>
                    {ALL_CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            {user.role === 'buyer' && (
              <>
                <div>
                  <label className="label-muted">COMPANY NAME</label>
                  <input
                    className="input-field"
                    value={form.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-muted">COMPANY LOCATION</label>
                  <input
                    className="input-field"
                    value={form.company_location}
                    onChange={(e) => updateField('company_location', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-muted">DELIVERY ADDRESS</label>
                  <input
                    className="input-field"
                    value={form.delivery_address}
                    onChange={(e) => updateField('delivery_address', e.target.value)}
                  />
                </div>
              </>
            )}

            {user.role === 'officer' && (
              <>
                <div>
                  <label className="label-muted">DEPARTMENT</label>
                  <input
                    className="input-field"
                    value={form.department}
                    onChange={(e) => updateField('department', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-muted">DISTRICT</label>
                  <select
                    className="input-field"
                    value={form.district}
                    onChange={(e) => updateField('district', e.target.value)}
                  >
                    <option value="">Select</option>
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-muted">DESIGNATION</label>
                  <input
                    className="input-field"
                    value={form.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} loading={saving} className="flex-1">
                Save Changes
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-0">
            <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
              <span className="text-sm text-text-muted">Name</span>
              <span className="text-sm font-semibold text-paddy">{user.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
              <span className="text-sm text-text-muted">Email</span>
              <span className="text-sm font-semibold text-paddy">{user.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
              <span className="text-sm text-text-muted">Phone</span>
              <span className="text-sm font-semibold text-paddy">{user.phone || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
              <span className="text-sm text-text-muted">Region</span>
              <span className="text-sm font-semibold text-paddy">{t(`regions.${user.region}`, { defaultValue: user.region })}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-text-muted">Language</span>
              <span className="text-sm font-semibold text-paddy">{user.preferred_language?.toUpperCase()}</span>
            </div>

            {/* Role-specific read-only */}
            {user.role === 'farmer' && user.farm_location && (
              <div className="flex items-center justify-between py-3 border-t border-surface-border/60">
                <span className="text-sm text-text-muted">Farm Location</span>
                <span className="text-sm font-semibold text-paddy">{user.farm_location}</span>
              </div>
            )}
            {user.role === 'buyer' && user.company_name && (
              <div className="flex items-center justify-between py-3 border-t border-surface-border/60">
                <span className="text-sm text-text-muted">Company</span>
                <span className="text-sm font-semibold text-paddy">{user.company_name}</span>
              </div>
            )}
            {user.role === 'officer' && user.officer_id && (
              <div className="flex items-center justify-between py-3 border-t border-surface-border/60">
                <span className="text-sm text-text-muted">Officer ID</span>
                <span className="text-sm font-semibold text-paddy">{user.officer_id}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Change password */}
      <Card className="space-y-4">
        <button
          onClick={() => setChangingPassword(!changingPassword)}
          className="flex items-center justify-between w-full"
        >
          <p className="font-display font-bold text-sm text-paddy flex items-center gap-2">
            <Shield size={15} className="text-turmeric" /> Change Password
          </p>
          <ChevronRight size={16} className={`text-text-muted transition-transform ${changingPassword ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {changingPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="label-muted">CURRENT PASSWORD</label>
                <PasswordInput
                  placeholder="Enter current password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-muted">NEW PASSWORD</label>
                <PasswordInput
                  placeholder="Minimum 6 characters"
                  value={pwForm.new}
                  onChange={(e) => setPwForm((p) => ({ ...p, new: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-muted">CONFIRM NEW PASSWORD</label>
                <PasswordInput
                  placeholder="Confirm new password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                />
              </div>
              <Button onClick={handleChangePassword} loading={saving} className="w-full">
                Update Password
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Logout */}
      <button
        onClick={() => { logout(); window.location.href = '/login' }}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-clay border border-clay/30 hover:bg-clay/5 active:scale-[0.98] transition"
      >
        <LogOut size={16} />
        {t('nav.logout')}
      </button>
    </div>
  )
}
