import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

/** Animated modal with slide-in reveal (Framer Motion). */
export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 60, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
              <h3 className="font-display font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-lg text-textmuted hover:text-textmain hover:bg-white/5 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
