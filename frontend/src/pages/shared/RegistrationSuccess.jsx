import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'

export default function RegistrationSuccess() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col items-center bg-cream">
      {/* Status bar */}
      <div className="w-full max-w-md px-6 pt-12 pb-4 flex items-center justify-between text-xs text-text-muted">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 w-full max-w-md">
        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 rounded-full bg-teal/20 grid place-items-center mb-8"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1F7A5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-lg font-bold text-paddy text-center mb-8"
        >
          You have successfully registered.
        </motion.p>

        {/* Login button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full"
        >
          <Button
            onClick={() => navigate('/login')}
            variant="turmeric"
            className="w-full"
          >
            Login
          </Button>
        </motion.div>
      </div>

      {/* Home indicator */}
      <div className="w-full flex justify-center pb-4">
        <div className="w-36 h-1.5 bg-paddy rounded-full" />
      </div>
    </div>
  )
}
