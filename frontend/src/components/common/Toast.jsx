import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'

let toastId = 0
const listeners = new Set()

export function showToast(message, type = 'success') {
  const id = ++toastId
  listeners.forEach((fn) => fn({ id, message, type }))
  return id
}

export default function Toast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3500)
    }
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-xs">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-raised ${
              t.type === 'success'
                ? 'bg-teal text-white'
                : 'bg-clay text-white'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
