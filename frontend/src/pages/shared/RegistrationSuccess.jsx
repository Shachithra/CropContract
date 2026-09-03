import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function RegistrationSuccess() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="min-h-dvh flex flex-col items-center bg-cream">
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
            onClick={() => { logout(); navigate('/login') }}
            variant="turmeric"
            className="w-full"
          >
            Login
          </Button>
        </motion.div>
      </div>

    </div>
  )
}
