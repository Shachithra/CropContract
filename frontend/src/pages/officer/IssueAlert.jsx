import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'
import { SRI_LANKA_DISTRICTS } from '../../lib/sriLankaRegions.js'

const DISEASES = ['Early Blight', 'Late Blight', 'Leaf Curl Virus', 'Bacterial Wilt', 'Powdery Mildew']

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
  const [sent, setSent] = useState(false)
  const [sentRegion, setSentRegion] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      region: 'Anuradhapura',
      disease: '',
      message: '',
    },
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      await api.post('/alerts', data)
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setSentRegion(data.region)
      setSent(true)
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (sent) {
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
          <h2 className="font-display text-xl font-bold text-paddy">Alert sent to {sentRegion}</h2>
          <p className="text-sm text-text-muted mt-2">
            Every farmer in the region will see this as a banner on their Home screen, including those currently offline once they reconnect.
          </p>
        </div>

        <Button onClick={() => navigate('/officer')} className="w-full max-w-xs">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-paddy">Issue Regional Alert</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Region & Disease */}
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-muted" htmlFor="region">REGION</label>
              <select id="region" className={`input-field ${errors.region ? 'border-clay' : ''}`} {...register('region')}>
                {SRI_LANKA_DISTRICTS.map((r) => (
                  <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
                ))}
              </select>
              {errors.region && <p className="text-clay text-xs mt-1">{errors.region.message}</p>}
            </div>
            <div>
              <label className="label-muted" htmlFor="disease">DISEASE</label>
              <select id="disease" className={`input-field ${errors.disease ? 'border-clay' : ''}`} {...register('disease')}>
                <option value="">Select disease</option>
                {DISEASES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.disease && <p className="text-clay text-xs mt-1">{errors.disease.message}</p>}
            </div>
          </div>
        </Card>

        {/* Message */}
        <Card className="space-y-3">
          <div>
            <label className="label-muted" htmlFor="message">MESSAGE TO FARMERS</label>
            <textarea
              id="message"
              rows={4}
              className={`input-field ${errors.message ? 'border-clay' : ''}`}
              placeholder="Moderate risk reported this week. Please check your crops daily — remove infected lower leaves. Treat immediately if detected."
              {...register('message')}
            />
            {errors.message && <p className="text-clay text-xs mt-1">{errors.message.message}</p>}
          </div>
        </Card>

        <Button type="submit" loading={loading} className="w-full">
          <Send size={15} />
          Send Alert to Region
        </Button>
      </form>

      {/* View outbreaks link */}
      <Link to="/officer/outbreaks" className="block">
        <button className="w-full rounded-xl px-4 py-3 font-display font-semibold text-sm text-paddy border border-paddy/30 hover:bg-paddy/5 active:scale-[0.98] transition">
          View Regional Outbreaks
        </button>
      </Link>

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
