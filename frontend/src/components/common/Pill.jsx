export default function Pill({ color = 'paddy', children, className = '' }) {
  const colors = {
    paddy: 'bg-paddy text-white',
    turmeric: 'bg-turmeric text-white',
    clay: 'bg-clay text-white',
    teal: 'bg-teal text-white',
    surface: 'bg-surface text-text-muted',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${colors[color] || colors.paddy} ${className}`}>
      {children}
    </span>
  )
}
