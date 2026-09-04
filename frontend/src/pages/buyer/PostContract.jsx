import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
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
  delivery_date: z.string().optional(),
  notes: z.string().optional(),
})

export default function PostContract() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)

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
      delivery_date: '',
      notes: '',
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
      if (data.delivery_date) body.delivery_date = data.delivery_date
      if (data.notes) body.notes = data.notes
      await api.post('/contracts', body)
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setPublished(true)
    } catch (err) {
      console.error('Contract publish error:', err.response?.data || err.message)
      const data = err.response?.data
      let msg = t('common.error')
      if (typeof data?.detail === 'string') {
        msg = data.detail
      } else if (Array.isArray(data?.detail)) {
        msg = data.detail.map((d) => d.msg).join('; ')
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Published success state
  if (published) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-teal/20 grid place-items-center"
        >
          <CheckCircle2 size={40} className="text-teal" />
        </motion.div>

        <div>
          <h2 className="font-display text-xl font-bold text-paddy">Contract published</h2>
          <p className="text-sm text-text-muted mt-2">
            Farmers in {formValues.region} can now view and commit to this contract.
          </p>
        </div>

        <Button onClick={() => navigate('/buyer')} className="w-full max-w-xs">
          View Contracts
        </Button>
      </div>
    )
  }

  // Publishing loading state
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full border-4 border-surface border-t-turmeric animate-spin" />
        <div>
          <h2 className="font-display text-xl font-bold text-paddy">Publishing...</h2>
          <p className="text-sm text-text-muted mt-2">
            Pushing this contract to farmers in {formValues.region}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 md:max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step === 1 ? setStep(0) : navigate(-1)} className="text-text-muted hover:text-paddy">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">{t('contract.postTitle')}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-surface overflow-hidden">
        <motion.div
          initial={{ width: '50%' }}
          animate={{ width: step === 0 ? '50%' : '100%' }}
          className="h-full rounded-full bg-paddy"
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card-surface p-5 space-y-4"
          >
            {/* Crop Type & Grade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-muted" htmlFor="crop">CROP TYPE</label>
                <select id="crop" className={`input-field ${errors.crop_type ? 'border-clay' : ''}`} {...register('crop_type')}>
                  {ALL_CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-muted" htmlFor="grade">GRADE</label>
                <select id="grade" className="input-field" {...register('grade')}>
                  {CROP_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-muted" htmlFor="total">REQUIRED QUANTITY IN KG</label>
                <input id="total" type="number" min={1} className={`input-field ${errors.total_kg ? 'border-clay' : ''}`} placeholder="e.g. 3000" {...register('total_kg')} />
                {errors.total_kg && <p className="text-clay text-xs mt-1">{errors.total_kg.message}</p>}
              </div>
              <div>
                <label className="label-muted" htmlFor="price">PRICE PER KG (Rs.)</label>
                <input id="price" type="number" step="0.01" min={0.01} className={`input-field ${errors.price_per_kg ? 'border-clay' : ''}`} placeholder="e.g. 210" {...register('price_per_kg')} />
                {errors.price_per_kg && <p className="text-clay text-xs mt-1">{errors.price_per_kg.message}</p>}
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="label-muted" htmlFor="region">REGION</label>
              <select id="region" className="input-field" {...register('region')}>
                {SRI_LANKA_DISTRICTS.map((r) => (
                  <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-muted" htmlFor="deadline">COMMITMENT DEADLINE</label>
                <input id="deadline" type="date" className="input-field" {...register('commit_deadline')} />
              </div>
              <div>
                <label className="label-muted" htmlFor="delivery">DELIVERY DATE</label>
                <input id="delivery" type="date" className="input-field" {...register('delivery_date')} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label-muted" htmlFor="notes">ADDITIONAL SPECIFICATIONS</label>
              <textarea
                id="notes"
                rows={3}
                className="input-field"
                placeholder="Optional notes"
                {...register('notes')}
              />
            </div>

            <Button onClick={() => setStep(1)} variant="turmeric" className="w-full">
              Next: Terms & Dates
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Preview card */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">NEW CONTRACT OFFER</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-bold text-paddy">{formValues.crop_type} -</p>
                <span className="chip bg-paddy/10 text-paddy border border-paddy/30">{formValues.grade}</span>
              </div>

              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
                  <span className="text-sm text-text-muted">Required quantity</span>
                  <span className="text-sm font-semibold text-paddy">{parseInt(formValues.total_kg || 0).toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
                  <span className="text-sm text-text-muted">Price</span>
                  <span className="text-sm font-semibold text-paddy">Rs. {formValues.price_per_kg} / kg</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
                  <span className="text-sm text-text-muted">Region</span>
                  <span className="text-sm font-semibold text-paddy">{t(`regions.${formValues.region}`, { defaultValue: formValues.region })}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-border/60">
                  <span className="text-sm text-text-muted">Commit by</span>
                  <span className="text-sm font-semibold text-turmeric">{formValues.commit_deadline || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-text-muted">Delivery date</span>
                  <span className="text-sm font-semibold text-paddy">{formValues.delivery_date || '—'}</span>
                </div>
              </div>
            </Card>

            {error && <p className="text-clay text-sm bg-clay/10 border border-clay/30 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit(onSubmit)} loading={loading} className="flex-1">
                Publish Contract
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to dashboard link */}
      <button
        onClick={() => navigate('/buyer')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}
