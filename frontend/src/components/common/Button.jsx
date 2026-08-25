import { Loader2 } from 'lucide-react'

export default function Button({ variant = 'primary', loading = false, children, className = '', ...props }) {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'turmeric' ? 'btn-turmeric' : variant === 'outline' ? 'btn-outline' : 'btn-danger'
  return (
    <button className={`${base} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
