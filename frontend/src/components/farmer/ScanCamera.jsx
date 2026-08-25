import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, Image } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ScanCamera({ onCapture, preview }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [flash, setFlash] = useState(false)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onCapture({ dataUrl: reader.result, file })
      setFlash(true)
      setTimeout(() => setFlash(false), 200)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-surface-border">
          <img src={preview} alt="Captured leaf" className="w-full aspect-[4/3] object-cover" />
          {flash && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white"
            />
          )}
          <button
            onClick={() => { onCapture(null); inputRef.current.value = '' }}
            className="absolute top-3 right-3 bg-paddy/80 text-white rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur"
          >
            {t('scan.retake')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-surface-border bg-white/50 hover:border-paddy/40 hover:bg-white transition flex flex-col items-center justify-center gap-3 text-text-muted"
        >
          <div className="w-16 h-16 rounded-full bg-paddy/10 grid place-items-center">
            <Camera size={28} className="text-paddy" />
          </div>
          <div className="text-center">
            <p className="font-display font-semibold text-sm text-paddy">{t('scan.capture')}</p>
            <p className="text-xs text-text-muted mt-0.5">Take a photo or choose from gallery</p>
          </div>
          <div className="flex gap-2 text-[11px] text-text-muted">
            <span className="flex items-center gap-1"><Camera size={12} /> Camera</span>
            <span className="flex items-center gap-1"><Image size={12} /> Gallery</span>
          </div>
        </button>
      )}
    </div>
  )
}
