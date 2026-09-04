import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, History, CheckCircle2, XCircle, Leaf } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ScanCamera from '../../components/farmer/ScanCamera.jsx'
import Button from '../../components/common/Button.jsx'
import Chip from '../../components/common/Chip.jsx'
import Card from '../../components/common/Card.jsx'
import api from '../../lib/api.js'
import { isOnline } from '../../lib/sync.js'
import { queueAction } from '../../lib/db.js'
import { compressImage, isValidImage } from '../../lib/imageCompress.js'
import { showToast } from '../../components/common/Toast.jsx'
import { ALL_CROPS } from '../../lib/sriLankaCrops.js'

export default function DiseaseScan() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [capture, setCapture] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [queuedNote, setQueuedNote] = useState(false)
  const [history, setHistory] = useState([])
  const [cropType, setCropType] = useState('')
  const mounted = useRef(true)

  useEffect(() => () => (mounted.current = false), [])

  async function loadHistory() {
    try {
      const { data } = await api.get('/scans/mine')
      if (mounted.current) setHistory(data.slice(0, 6))
    } catch { /* offline */ }
  }
  useEffect(() => { loadHistory() }, [])

  async function analyze() {
    if (!capture?.file || analyzing) return
    if (!isValidImage(capture.file)) {
      showToast(t('common.error'), 'error')
      return
    }
    setAnalyzing(true)
    setResult(null)
    try {
      const compressed = await compressImage(capture.file)
      if (!isOnline()) {
        const reader = new FileReader()
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1] || '')
          reader.readAsDataURL(compressed)
        })
        await queueAction('disease_scan', { image_b64: base64, crop_type: cropType || 'unknown' })
        setQueuedNote(true)
        return
      }
      const form = new FormData()
      form.append('file', compressed, 'leaf.jpg')
      if (cropType) form.append('crop_type', cropType)
      const { data } = await api.post('/disease-scan', form)
      setResult(data)
      loadHistory()
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  // Analyzing state
  if (analyzing) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center space-y-6">
        <div className="flex items-center gap-2 text-turmeric">
          <span className="font-semibold text-sm">Analyzing</span>
          <span className="px-2 py-0.5 rounded-full bg-turmeric/15 text-[11px] font-semibold">Processing...</span>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-surface border-t-turmeric animate-spin" />
        <div>
          <h2 className="font-display text-xl font-bold text-paddy">Analyzing your photo</h2>
          <p className="text-sm text-text-muted mt-2">
            Running on-device AI. This works even without a connection — no data leaves your phone until you're online.
          </p>
        </div>
      </div>
    )
  }

  // Result state
  if (result) {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        {/* Image preview */}
        {capture?.dataUrl && (
          <div className="relative rounded-2xl overflow-hidden border border-surface-border">
            <img src={capture.dataUrl} alt="Scanned leaf" className="w-full aspect-[4/3] object-cover" />
            <div className="absolute top-3 left-3 bg-paddy/80 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur">
              {cropType || 'Crop'} · scanned just now
            </div>
          </div>
        )}

        {/* AI Prediction */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-turmeric/15 text-turmeric text-[11px] font-semibold">AI PREDICTION</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Confidence circle */}
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E8E0CC" strokeWidth="4" />
                <motion.circle
                  cx="18" cy="18" r="15.5"
                  fill="none" stroke="#2F5233" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(result.confidence * 97.4).toFixed(1)} 97.4`}
                  initial={{ strokeDasharray: '0 97.4' }}
                  animate={{ strokeDasharray: `${(result.confidence * 97.4).toFixed(1)} 97.4` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center font-display font-bold text-sm text-paddy">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>

            <div>
              <p className="font-display font-bold text-lg text-paddy">{result.disease}</p>
              <p className="text-xs text-text-muted mt-0.5">
                Match confidence for early stage {result.disease?.toLowerCase()} symptoms
              </p>
              <Chip tone={result.severity} className="mt-2">{result.severity} severity</Chip>
            </div>
          </div>

          {/* Treatment */}
          <div>
            <p className="label-muted">RECOMMENDED TREATMENT</p>
            <ol className="space-y-2 mt-2">
              {(result.treatment_step_keys || result.treatment_steps || []).map((key, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <CheckCircle2 size={16} className="text-teal shrink-0 mt-0.5" />
                  <span className="text-paddy">{typeof key === 'string' ? t(`treatment.${key}`, key) : key}</span>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Offline notice */}
          <div className="flex items-center gap-2 text-xs text-text-muted bg-cream rounded-xl px-3 py-2 border border-surface-border">
            <Leaf size={14} className="text-teal" />
            <span>Saved offline</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setResult(null); setCapture(null) }} className="flex-1">
              Retake
            </Button>
            <Button onClick={() => setResult(null)} className="flex-1">
              View History
            </Button>
          </div>
        </Card>

        {/* Back to home */}
        <button
          onClick={() => navigate('/farmer')}
          className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
        >
          ← Back to Home
        </button>
      </div>
    )
  }

  // Camera view
  return (
    <div className="space-y-4 max-w-xl mx-auto md:max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
          <ArrowLeft size={16} /> {t('common.back')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Crop</span>
          <span className="px-2 py-0.5 rounded-full bg-teal/15 text-teal text-[11px] font-semibold">Automatically Captures the Crop</span>
        </div>
      </div>

      {/* Camera area */}
      <ScanCamera onCapture={setCapture} preview={capture?.dataUrl} />

      {capture && !result && (
        <>
          <p className="text-xs text-text-muted text-center">
            Take a clear photo of the affected leaf.
          </p>
          <p className="text-[11px] text-text-muted/70 text-center">
            Hold steady, fill the frame with the leaf, avoid shadows.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setCapture(null) }} className="flex-1">
              Retake
            </Button>
            <Button onClick={analyze} loading={analyzing} className="flex-1">
              Capture
            </Button>
          </div>
        </>
      )}

      {queuedNote && (
        <div className="rounded-xl border border-turmeric/40 bg-turmeric/10 text-turmeric text-sm px-4 py-3 flex items-center gap-2">
          {t('scan.offlineQueued')}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="space-y-3">
          <p className="font-display font-bold text-sm text-paddy flex items-center gap-2">
            <History size={15} className="text-turmeric" /> {t('scan.history')}
          </p>
          <ul className="space-y-2">
            {history.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between bg-cream border border-surface-border rounded-xl px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-paddy truncate">{s.disease}</p>
                  <p className="text-[11px] text-text-muted">
                    {s.scanned_at} · {Math.round(s.confidence * 100)}%
                  </p>
                </div>
                {s.review_status === 'confirmed' ? (
                  <CheckCircle2 size={16} className="text-teal shrink-0" />
                ) : s.review_status === 'dismissed' ? (
                  <XCircle size={16} className="text-text-muted shrink-0" />
                ) : (
                  <Chip tone={s.severity}>{s.severity}</Chip>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
