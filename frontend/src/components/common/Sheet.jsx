import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Sheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-t-2xl shadow-raised max-h-[85vh] overflow-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border sticky top-0 bg-white">
              <h3 className="font-display font-bold text-paddy">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-lg text-text-muted hover:text-paddy hover:bg-surface transition"
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
