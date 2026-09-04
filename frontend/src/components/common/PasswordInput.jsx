import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const PasswordInput = forwardRef(function PasswordInput({ className = '', ...props }, ref) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative" data-1p-ignore data-lpignore="true" data-lastpass-ignore>
      <input
        ref={ref}
        type="text"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        className={`input-field pr-10 ${className}`}
        style={!visible ? { WebkitTextSecurity: 'disc', textSecurity: 'disc' } : undefined}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-paddy transition z-10"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
})

export default PasswordInput
