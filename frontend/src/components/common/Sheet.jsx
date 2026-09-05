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
            className="w-full max-w-lg bg-white rounded-t-3xl shadow-raised max-h-[85vh] overflow-auto pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-white">
              <h3 className="font-display font-bold text-paddy text-lg">{title}</h3>
              <button
                onClick={onClose}
                className="w-10 h-10 grid place-items-center rounded-xl text-text-muted hover:text-paddy hover:bg-surface transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
