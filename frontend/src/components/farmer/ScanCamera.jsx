import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, ImageUp } from 'lucide-react'

/**
 * Native camera capture via <input capture="environment">.
 * Emits { dataUrl, file } to onCapture.
 */
export default function ScanCamera({ onCapture, preview: externalPreview }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [localPreview, setLocalPreview] = useState(null)
  const preview = externalPreview || localPreview

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLocalPreview(reader.result)
      onCapture?.({ dataUrl: reader.result, file })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="card-surface p-5 flex flex-col items-center gap-4">
      <div className="w-full aspect-square max-w-xs rounded-2xl bg-forest border border-dashed border-emerald/40 grid place-items-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="leaf scan" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-textmuted px-6">
            <Camera size={40} className="mx-auto mb-2 text-emerald/60" />
            <p className="text-xs">{t('scan.subtitle')}</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <button onClick={() => inputRef.current?.click()} className="btn-primary w-full max-w-xs">
        <ImageUp size={16} />
        {preview ? t('scan.retake') : t('scan.capture')}
      </button>
    </div>
  )
}
