import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'
import { ALL_CROPS } from '../../lib/sriLankaCrops.js'

const alertSchema = z.object({
  region: z.string().min(1, 'Select a region'),
  disease: z.string().min(1, 'Select a disease'),
  message: z.string().min(10, 'Alert message must be at least 10 characters'),
})

export default function IssueAlert() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      region: 'Colombo',
      disease: '',
      message: '',
    },
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      await api.post('/alerts', data)
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      showToast(t('officer.alertSent'), 'success')
      navigate('/officer')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">{t('officer.issueAlert')}</h1>
        <p className="text-text-muted text-sm mt-0.5">Notify farmers in the affected region</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card-surface p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-muted" htmlFor="region">{t('officer.alertRegion')}</label>
            <select id="region" className={`input-field ${errors.region ? 'border-clay' : ''}`} {...register('region')}>
              {SRI_LANKA_DISTRICTS.map((r) => (
                <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
              ))}
            </select>
            {errors.region && <p className="text-clay text-xs mt-1">{errors.region.message}</p>}
          </div>
          <div>
            <label className="label-muted" htmlFor="disease">{t('officer.alertDisease')}</label>
            <select id="disease" className={`input-field ${errors.disease ? 'border-clay' : ''}`} {...register('disease')}>
              <option value="">Select disease</option>
              {ALL_CROPS.map((c) => <option key={c} value={c}>{c} disease</option>)}
            </select>
            {errors.disease && <p className="text-clay text-xs mt-1">{errors.disease.message}</p>}
          </div>
        </div>

        <div>
          <label className="label-muted" htmlFor="message">{t('officer.alertMessage')}</label>
          <textarea
            id="message"
            rows={4}
            className={`input-field ${errors.message ? 'border-clay' : ''}`}
            placeholder="Describe the disease outbreak and recommended actions..."
            {...register('message')}
          />
          {errors.message && <p className="text-clay text-xs mt-1">{errors.message.message}</p>}
        </div>

        <Button type="submit" loading={loading} className="w-full">
          <Send size={15} />
          {t('officer.sendAlert')}
        </Button>
      </form>
    </div>
  )
}
