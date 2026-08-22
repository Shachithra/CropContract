import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ScanSearch, CloudUpload, History, CheckCircle2, XCircle } from 'lucide-react'
import ScanCamera from '../../components/farmer/ScanCamera.jsx'
import Button from '../../components/common/Button.jsx'
import Chip from '../../components/common/Chip.jsx'
import Modal from '../../components/common/Modal.jsx'
import api from '../../lib/api.js'
import { isOnline } from '../../lib/sync.js'
import { queueAction } from '../../lib/db.js'

export default function DiseaseScan() {
  const { t } = useTranslation()
  const [capture, setCapture] = useState(null) // { dataUrl, file }
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [queuedNote, setQueuedNote] = useState(false)
  const [history, setHistory] = useState([])
  const mounted = useRef(true)

  useEffect(() => () => (mounted.current = false), [])

  async function loadHistory() {
    try {
      const { data } = await api.get('/scans/mine')
      if (mounted.current) setHistory(data.slice(0, 6))
    } catch {
      /* offline - skip */
    }
  }
  useEffect(() => {
    loadHistory()
  }, [])

  async function analyze() {
    if (!capture?.file || analyzing) return
    setAnalyzing(true)
    setResult(null)
    try {
      if (!isOnline()) {
        // Queue the scan as base64 for later /sync replay
        await queueAction('disease_scan', {
          image_b64: capture.dataUrl.split(',')[1] || '',
          crop_type: 'unknown',
        })
        setQueuedNote(true)
        return
      }
      const form = new FormData()
      form.append('file', capture.file)
      const { data } = await api.post('/disease-scan', form)
      setResult(data)
      loadHistory()
    } catch {
      alert(t('common.error'))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('scan.title')}</h1>
        <p className="text-textmuted text-sm mt-0.5">{t('scan.subtitle')}</p>
      </div>

      <ScanCamera onCapture={setCapture} preview={capture?.dataUrl} />

      {capture && !result && (
        <Button onClick={analyze} loading={analyzing} className="w-full">
          <ScanSearch size={16} />
          {t('scan.analyze')}
        </Button>
      )}

      {queuedNote && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 text-gold text-sm px-4 py-3 flex items-center gap-2">
          <CloudUpload size={16} />
          {t('scan.offlineQueued')}
        </div>
      )}

      {/* Diagnosis reveal */}
      <Modal open={!!result} onClose={() => setResult(null)} title={t('scan.diagnosis')}>
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl font-bold">{result.disease}</p>
              <Chip tone={result.severity}>{t(`scan.severity.${result.severity}`)}</Chip>
            </div>

            {/* Confidence ring */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1B3E30" strokeWidth="4" />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.confidence * 97.4).toFixed(1)} 97.4`}
                    initial={{ strokeDasharray: '0 97.4' }}
                    animate={{ strokeDasharray: `${(result.confidence * 97.4).toFixed(1)} 97.4` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </svg>
                <span className="absolute inset-0 grid place-items-center font-display font-bold text-sm">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div className="text-xs text-textmuted">
                <p>{t('scan.confidence')}</p>
                <p className="text-textmain font-semibold mt-0.5">{t('scan.advice')}: <span className="text-mint">{result.advice}</span></p>
              </div>
            </div>

            <div>
              <p className="label-muted">{t('scan.treatment')}</p>
              <ol className="space-y-2">
                {result.treatment_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm bg-forest border border-surface-border rounded-xl px-3.5 py-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald/15 text-emerald grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <Button className="w-full" onClick={() => setResult(null)}>
              {t('common.save')}
            </Button>
          </div>
        )}
      </Modal>

      {/* History */}
      <div className="card-surface p-4">
        <p className="font-display font-bold text-sm mb-3 flex items-center gap-2">
          <History size={15} className="text-emerald" /> {t('scan.history')}
        </p>
        {history.length === 0 ? (
          <p className="text-textmuted text-xs py-4 text-center">{t('common.empty')}</p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {history.map((s) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between bg-forest border border-surface-border rounded-xl px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.disease}</p>
                    <p className="text-[11px] text-textmuted">
                      {s.scanned_at} · {Math.round(s.confidence * 100)}%
                    </p>
                  </div>
                  {s.review_status === 'confirmed' ? (
                    <CheckCircle2 size={16} className="text-mint shrink-0" />
                  ) : s.review_status === 'dismissed' ? (
                    <XCircle size={16} className="text-textmuted shrink-0" />
                  ) : (
                    <Chip tone={s.severity}>{t(`scan.severity.${s.severity}`)}</Chip>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
