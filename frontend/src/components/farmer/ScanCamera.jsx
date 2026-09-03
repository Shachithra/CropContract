import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ScanCamera({ onCapture, preview }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [flash, setFlash] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [starting, setStarting] = useState(false)
  const [cameraError, setCameraError] = useState('')

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
    setCameraOn(false)
  }

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop())
  }, [])

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraOn])

  async function openCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t('scan.cameraUnavailable'))
      inputRef.current?.click()
      return
    }
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOn(true)
    } catch {
      setCameraError(t('scan.cameraUnavailable'))
    } finally {
      setStarting(false)
    }
  }

  function shoot() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'leaf.jpg', { type: 'image/jpeg' })
      onCapture({ dataUrl: canvas.toDataURL('image/jpeg'), file })
      stopCamera()
      setFlash(true)
      setTimeout(() => setFlash(false), 200)
    }, 'image/jpeg', 0.9)
  }

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
            onClick={() => { onCapture(null); if (inputRef.current) inputRef.current.value = '' }}
            className="absolute top-3 right-3 bg-paddy/80 text-white rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur"
          >
            {t('scan.retake')}
          </button>
        </div>
      ) : cameraOn ? (
        <div className="relative rounded-2xl overflow-hidden border border-surface-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-3 flex gap-3">
            <button
              onClick={stopCamera}
              className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 font-display font-semibold text-sm text-white bg-black/50 backdrop-blur hover:bg-black/70 transition"
            >
              <X size={16} /> {t('common.cancel')}
            </button>
            <button
              onClick={shoot}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-white bg-turmeric hover:brightness-110 active:scale-[0.98] transition"
            >
              <Camera size={16} /> {t('scan.captureButton')}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-surface-border bg-white/50 flex flex-col items-center justify-center gap-3 text-text-muted px-6">
          <div className="w-16 h-16 rounded-full bg-paddy/10 grid place-items-center">
            <Camera size={28} className="text-paddy" />
          </div>
          <div className="text-center">
            <p className="font-display font-semibold text-sm text-paddy">{t('scan.capture')}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('scan.takeClearPhoto')}</p>
          </div>
          <button
            onClick={openCamera}
            disabled={starting}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-display font-semibold text-sm text-white bg-turmeric hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
          >
            {starting ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {t('scan.openCamera')}
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
          >
            <Upload size={13} /> {t('scan.uploadPhoto')}
          </button>
          {cameraError && (
            <p className="text-[11px] text-red-600 text-center">{cameraError}</p>
          )}
        </div>
      )}
    </div>
  )
}
