const riskColors = {
  low: 'bg-teal/15 text-teal border-teal/40',
  moderate: 'bg-turmeric/15 text-turmeric border-turmeric/40',
  high: 'bg-clay/15 text-clay border-clay/50',
  critical: 'bg-clay text-white border-clay',
}

export default function RiskBadge({ level, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${riskColors[level] || riskColors.low} ${className}`}>
      {level === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      {level}
    </span>
  )
}
