import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../../components/common/Button.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'
import { requestNotificationPermission } from '../../lib/notifications.js'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
]

const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferred_language: z.string(),
})

export default function RegisterForm() {
  const { t } = useTranslation()
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const selectedRole = location.state?.selectedRole || 'farmer'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      region: 'Colombo',
      preferred_language: 'en',
      farm_name: '',
      farm_location: '',
      farm_size_acres: '',
      years_experience: '',
      company_name: '',
      business_type: '',
      purchase_volume_tons: '',
      delivery_address: '',
      officer_id: '',
      department: '',
      district: '',
      designation: '',
      years_of_service: '',
    },
  })

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  async function onSubmit(data) {
    setError('')
    setLoading(true)
    try {
      const { default: api } = await import('../../lib/api.js')
      const body = {
        name: data.name,
        email: data.phone ? `${data.phone}@cropcontract.lk` : `user${Date.now()}@cropcontract.lk`,
        password: data.password,
        role: selectedRole,
        region: selectedRole === 'officer' ? data.district : data.region,
        phone: data.phone,
        preferred_language: data.preferred_language,
      }
      const u = await register(api, body)

      if (selectedRole === 'farmer') {
        requestNotificationPermission()
      }

      navigate(homePathFor(u.role), { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Registration failed — check your details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-10 bg-cream">
      <div className="w-full max-w-lg">
        <button onClick={() => navigate('/register')} className="text-sm text-text-muted hover:text-paddy mb-4">
          ← {t('common.back')}
        </button>
        <h1 className="font-display text-2xl font-bold text-paddy">{t(`auth.${selectedRole}`)}</h1>
        <p className="text-text-muted text-sm mt-1 mb-6">{t('tagline')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label-muted" htmlFor="name">{t('auth.name')}</label>
            <input
              id="name"
              className={`input-field ${errors.name ? 'border-clay focus:border-clay focus:ring-clay/50' : ''}`}
              {...registerField('name')}
            />
            {errors.name && <p className="text-clay text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-muted" htmlFor="phone">{t('auth.phone')}</label>
              <input id="phone" type="tel" maxLength={13} className="input-field" placeholder="+94 77 123 4567" {...registerField('phone')} />
            </div>
            <div>
              <label className="label-muted" htmlFor="password">{t('auth.password')}</label>
              <PasswordInput
                id="password"
                {...registerField('password')}
              />
              {errors.password && <p className="text-clay text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          {selectedRole === 'farmer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-muted" htmlFor="farm_name">{t('auth.farmName')}</label>
                  <input id="farm_name" className="input-field" {...registerField('farm_name')} />
                </div>
                <div>
                  <label className="label-muted" htmlFor="farm_location">{t('auth.farmLocation')}</label>
                  <input id="farm_location" className="input-field" {...registerField('farm_location')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-muted" htmlFor="farm_size">{t('auth.farmSize')}</label>
                  <input id="farm_size" type="number" step="0.1" className="input-field" {...registerField('farm_size_acres')} />
                </div>
                <div>
                  <label className="label-muted" htmlFor="experience">{t('auth.yearsExperience')}</label>
                  <input id="experience" type="number" className="input-field" {...registerField('years_experience')} />
                </div>
              </div>
              <div>
                <label className="label-muted" htmlFor="region">{t('auth.region')}</label>
                <select id="region" className="input-field" {...registerField('region')}>
                  {SRI_LANKA_DISTRICTS.map((r) => (
                    <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {selectedRole === 'buyer' && (
            <>
              <div>
                <label className="label-muted" htmlFor="company">{t('auth.companyName')}</label>
                <input id="company" className="input-field" {...registerField('company_name')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-muted" htmlFor="biz_type">{t('auth.businessType')}</label>
                  <input id="biz_type" className="input-field" placeholder="e.g. Wholesale" {...registerField('business_type')} />
                </div>
                <div>
                  <label className="label-muted" htmlFor="volume">{t('auth.purchaseVolume')}</label>
                  <input id="volume" type="number" step="0.1" className="input-field" {...registerField('purchase_volume_tons')} />
                </div>
              </div>
              <div>
                <label className="label-muted" htmlFor="delivery">{t('auth.deliveryAddress')}</label>
                <input id="delivery" className="input-field" {...registerField('delivery_address')} />
              </div>
            </>
          )}

          {selectedRole === 'officer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-muted" htmlFor="officer_id">{t('auth.officerId')}</label>
                  <input id="officer_id" className="input-field" {...registerField('officer_id')} />
                </div>
                <div>
                  <label className="label-muted" htmlFor="dept">{t('auth.department')}</label>
                  <input id="dept" className="input-field" {...registerField('department')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-muted" htmlFor="district">{t('auth.district')}</label>
                  <select id="district" className="input-field" {...registerField('district')}>
                    <option value="">Select district</option>
                    {SRI_LANKA_DISTRICTS.map((d) => <option key={d} value={d}>{t(`regions.${d}`, { defaultValue: d })}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-muted" htmlFor="designation">{t('auth.designation')}</label>
                  <input id="designation" className="input-field" {...registerField('designation')} />
                </div>
              </div>
            </>
          )}

          {selectedRole !== 'officer' && (
            <div>
              <label className="label-muted" htmlFor="lang">{t('auth.language')}</label>
              <select id="lang" className="input-field" {...registerField('preferred_language')}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          )}

          {error && (
            <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {t('auth.signUp')}
          </Button>
        </form>
      </div>
    </div>
  )
}
