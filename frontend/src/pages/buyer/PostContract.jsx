import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import Button from '../../components/common/Button.jsx'
import api from '../../lib/api.js'

const CROPS = ['Tomato', 'Green Chilli', 'Carrot', 'Red Onion', 'Rice', 'Potato', 'Cabbage']
const GRADES = ['Grade A', 'Grade B', 'Export']
const REGIONS = ['Dambulla', 'Nuwara Eliya', 'Jaffna', 'Colombo', 'Anuradhapura', 'Matara']

export default function PostContract() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    crop_type: 'Tomato',
    grade: 'Grade A',
    total_kg: '',
    price_per_kg: '',
    region: 'Dambulla',
    commit_deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = {
        crop_type: form.crop_type,
        grade: form.grade,
        total_kg: parseInt(form.total_kg, 10),
        price_per_kg: parseFloat(form.price_per_kg),
        region: form.region,
      }
      if (form.commit_deadline) body.commit_deadline = form.commit_deadline
      await api.post('/contracts', body)
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
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
        <h1 className="font-display text-2xl font-bold">{t('contract.postTitle')}</h1>
        <p className="text-textmuted text-sm mt-0.5">{t('contract.postSubtitle')}</p>
      </div>

      <form onSubmit={onSubmit} className="card-surface p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-muted" htmlFor="crop">{t('contract.cropType')}</label>
            <select id="crop" className="input-dark" value={form.crop_type} onChange={set('crop_type')}>
              {CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-muted" htmlFor="grade">{t('contract.grade')}</label>
            <select id="grade" className="input-dark" value={form.grade} onChange={set('grade')}>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-muted" htmlFor="total">{t('contract.totalKg')}</label>
            <input
              id="total"
              type="number"
              min={1}
              required
              className="input-dark"
              placeholder="2000"
              value={form.total_kg}
              onChange={set('total_kg')}
            />
          </div>
          <div>
            <label className="label-muted" htmlFor="price">{t('contract.pricePerKg')}</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min={0.01}
              required
              className="input-dark"
              placeholder="185.00"
              value={form.price_per_kg}
              onChange={set('price_per_kg')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-muted" htmlFor="region">{t('auth.region')}</label>
            <select id="region" className="input-dark" value={form.region} onChange={set('region')}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{t(`regions.${r}`, { defaultValue: r })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-muted" htmlFor="deadline">Commit deadline</label>
            <input id="deadline" type="date" className="input-dark" value={form.commit_deadline} onChange={set('commit_deadline')} />
          </div>
        </div>

        {error && (
          <p className="text-alert text-sm bg-alert/10 border border-alert/30 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          {t('nav.post')}
        </Button>
      </form>
    </div>
  )
}
