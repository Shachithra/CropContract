import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'
import { ALL_CROPS } from '../../lib/sriLankaCrops.js'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'

const priceRangeSchema = z.object({
  crop_type: z.string().min(1, 'Select a crop type'),
  region: z.string().min(1, 'Select a region'),
  min_price_per_kg: z.coerce.number().positive('Must be positive'),
  max_price_per_kg: z.coerce.number().positive('Must be positive'),
}).refine((data) => data.min_price_per_kg < data.max_price_per_kg, {
  message: 'Min price must be less than max price',
  path: ['max_price_per_kg'],
})

export default function PriceRanges() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: ranges = [], isLoading } = useQuery({
    queryKey: ['price-ranges'],
    queryFn: async () => (await api.get('/price-ranges')).data,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(priceRangeSchema),
    defaultValues: {
      crop_type: 'Tomato',
      region: 'Dambulla',
      min_price_per_kg: '',
      max_price_per_kg: '',
    },
  })

  const formValues = watch()

  async function onSubmit(data) {
    setLoading(true)
    try {
      await api.post('/price-ranges', data)
      queryClient.invalidateQueries({ queryKey: ['price-ranges'] })
      showToast(t('priceRange.rangeSaved'), 'success')
      reset()
      setShowForm(false)
    } catch (err) {
      const detail = err.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(rangeId) {
    if (!confirm(t('priceRange.confirmDelete'))) return
    try {
      await api.delete(`/price-ranges/${rangeId}`)
      queryClient.invalidateQueries({ queryKey: ['price-ranges'] })
      showToast(t('common.save'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">{t('priceRange.title')}</h1>
          <p className="text-text-muted text-sm mt-0.5">Set minimum and maximum prices per crop and region</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary !rounded-xl flex items-center gap-2"
        >
          <Plus size={16} />
          {t('priceRange.setRange')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-muted">{t('priceRange.cropType')}</label>
                <select className="input-field" {...register('crop_type')}>
                  {ALL_CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.crop_type && <p className="text-clay text-xs mt-1">{errors.crop_type.message}</p>}
              </div>
              <div>
                <label className="label-muted">{t('priceRange.region')}</label>
                <select className="input-field" {...register('region')}>
                  <option value="All Regions">All Regions</option>
                  {SRI_LANKA_DISTRICTS.map((r) => (
                    <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
                  ))}
                </select>
                {errors.region && <p className="text-clay text-xs mt-1">{errors.region.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-muted">{t('priceRange.minPrice')}</label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  className={`input-field ${errors.min_price_per_kg ? 'border-clay' : ''}`}
                  placeholder="e.g. 150"
                  {...register('min_price_per_kg')}
                />
                {errors.min_price_per_kg && <p className="text-clay text-xs mt-1">{errors.min_price_per_kg.message}</p>}
              </div>
              <div>
                <label className="label-muted">{t('priceRange.maxPrice')}</label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  className={`input-field ${errors.max_price_per_kg ? 'border-clay' : ''}`}
                  placeholder="e.g. 350"
                  {...register('max_price_per_kg')}
                />
                {errors.max_price_per_kg && <p className="text-clay text-xs mt-1">{errors.max_price_per_kg.message}</p>}
              </div>
            </div>

            {/* Preview */}
            {formValues.min_price_per_kg && formValues.max_price_per_kg && (
              <div className="bg-cream border border-surface-border rounded-xl px-4 py-3">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Preview</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-paddy">{formValues.crop_type} · {t(`regions.${formValues.region}`, { defaultValue: formValues.region })}</span>
                  <span className="text-sm font-semibold text-paddy">Rs. {formValues.min_price_per_kg} — {formValues.max_price_per_kg}/kg</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowForm(false); reset() }} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit(onSubmit)} loading={loading} className="flex-1">
                {t('common.save')}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Price Range List */}
      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : ranges.length === 0 ? (
        <Card className="text-center py-12">
          <DollarSign size={28} className="mx-auto mb-2 text-paddy/30" />
          <p className="text-text-muted text-sm">{t('priceRange.noRanges')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {ranges.map((range, i) => (
            <motion.div
              key={range.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-paddy">{range.crop_type}</p>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">{t(`regions.${range.region}`, { defaultValue: range.region })}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="bg-teal/10 border border-teal/30 rounded-lg px-3 py-1.5">
                        <p className="text-[10px] text-teal uppercase font-semibold">Min</p>
                        <p className="text-sm font-bold text-teal">Rs. {range.min_price_per_kg}</p>
                      </div>
                      <div className="bg-clay/10 border border-clay/30 rounded-lg px-3 py-1.5">
                        <p className="text-[10px] text-clay uppercase font-semibold">Max</p>
                        <p className="text-sm font-bold text-clay">Rs. {range.max_price_per_kg}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-muted mt-2">
                      {t('priceRange.setBy', { name: range.set_by_name || 'Unknown' })} · {range.set_at}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(range.id)}
                    className="text-text-muted hover:text-clay transition p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Back to dashboard */}
      <button
        onClick={() => navigate('/officer')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}
