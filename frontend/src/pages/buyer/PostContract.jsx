import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'
import { ALL_CROPS, CROP_GRADES } from '../../lib/sriLankaCrops.js'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'

const contractSchema = z.object({
  crop_type: z.string().min(1, 'Select a crop type'),
  grade: z.string().min(1, 'Select a grade'),
  total_kg: z.coerce.number().int().positive('Must be a positive number'),
  price_per_kg: z.coerce.number().positive('Must be a positive number'),
  region: z.string().min(1, 'Select a region'),
  commit_deadline: z.string().optional(),
})

export default function PostContract() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      crop_type: 'Tomato',
      grade: 'Grade A',
      total_kg: '',
      price_per_kg: '',
      region: 'Colombo',
      commit_deadline: '',
    },
  })

  const formValues = watch()

  async function onSubmit(data) {
    setError('')
    setLoading(true)
    try {
      const body = {
        crop_type: data.crop_type,
        grade: data.grade,
        total_kg: data.total_kg,
        price_per_kg: data.price_per_kg,
        region: data.region,
      }
      if (data.commit_deadline) body.commit_deadline = data.commit_deadline
      await api.post('/contracts', body)
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      showToast(t('contract.posted'), 'success')
      navigate('/buyer')
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t('contract.postTitle')}</h1>
        <p className="text-text-muted text-sm mt-0.5">{t('contract.postSubtitle')}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className={`font-semibold ${step === 0 ? 'text-paddy' : ''}`}>{t('common.step', { current: 1, total: 2 })}</span>
        <div className="flex-1 h-1 rounded-full bg-surface overflow-hidden">
          <div className={`h-full rounded-full bg-turmeric transition-all ${step === 0 ? 'w-1/2' : 'w-full'}`} />
        </div>
        <span className={`font-semibold ${step === 1 ? 'text-paddy' : ''}`}>{t('common.step', { current: 2, total: 2 })}</span>
      </div>

      {step === 0 ? (
        <div className="card-surface p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-muted" htmlFor="crop">{t('contract.cropType')}</label>
              <select id="crop" className={`input-field ${errors.crop_type ? 'border-clay' : ''}`} {...register('crop_type')}>
                {ALL_CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.crop_type && <p className="text-clay text-xs mt-1">{errors.crop_type.message}</p>}
            </div>
            <div>
              <label className="label-muted" htmlFor="grade">{t('contract.grade')}</label>
              <select id="grade" className="input-field" {...register('grade')}>
                {CROP_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-muted" htmlFor="total">{t('contract.totalKg')}</label>
              <input id="total" type="number" min={1} className={`input-field ${errors.total_kg ? 'border-clay' : ''}`} placeholder="2000" {...register('total_kg')} />
              {errors.total_kg && <p className="text-clay text-xs mt-1">{errors.total_kg.message}</p>}
            </div>
            <div>
              <label className="label-muted" htmlFor="price">{t('contract.pricePerKg')}</label>
              <input id="price" type="number" step="0.01" min={0.01} className={`input-field ${errors.price_per_kg ? 'border-clay' : ''}`} placeholder="185.00" {...register('price_per_kg')} />
              {errors.price_per_kg && <p className="text-clay text-xs mt-1">{errors.price_per_kg.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-muted" htmlFor="region">{t('auth.region')}</label>
              <select id="region" className="input-field" {...register('region')}>
                {SRI_LANKA_DISTRICTS.map((r) => (
                  <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-muted" htmlFor="deadline">{t('contract.deadline', { date: '' }).replace(/:.*$/, '')}</label>
              <input id="deadline" type="date" className="input-field" {...register('commit_deadline')} />
            </div>
          </div>

          <Button onClick={() => setStep(1)} className="w-full">{t('common.next')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-lg text-paddy">{formValues.crop_type}</p>
              <span className="chip bg-paddy/10 text-paddy border border-paddy/30">{formValues.grade}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="label-muted">{t('contract.totalKg')}</p><p className="font-medium text-paddy">{parseInt(formValues.total_kg || 0).toLocaleString()} kg</p></div>
              <div><p className="label-muted">{t('contract.pricePerKg')}</p><p className="font-medium text-paddy">Rs. {formValues.price_per_kg}</p></div>
              <div><p className="label-muted">{t('auth.region')}</p><p className="font-medium text-paddy">{t(`regions.${formValues.region}`, { defaultValue: formValues.region })}</p></div>
              <div><p className="label-muted">{t('contract.deadline', { date: '' }).replace(/:.*$/, '')}</p><p className="font-medium text-paddy">{formValues.commit_deadline || '—'}</p></div>
            </div>
          </Card>

          {error && <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1">{t('common.back')}</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={loading} className="flex-1">{t('common.publish')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
