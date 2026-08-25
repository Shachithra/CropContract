const styles = {
  open: 'bg-teal/15 text-teal border border-teal/40',
  fulfilled: 'bg-teal text-white',
  closed: 'bg-surface-border/50 text-text-muted border border-surface-border',
  pending: 'bg-turmeric/15 text-turmeric border border-turmeric/40',
  synced: 'bg-teal/15 text-teal border border-teal/40',
  active: 'bg-paddy/15 text-paddy border border-paddy/30',
  low: 'bg-teal/15 text-teal border border-teal/40',
  moderate: 'bg-turmeric/15 text-turmeric border border-turmeric/40',
  high: 'bg-clay/15 text-clay border border-clay/50',
  critical: 'bg-clay text-white border border-clay',
  gold: 'bg-turmeric/15 text-turmeric border border-turmeric/40',
  committed: 'bg-paddy/15 text-paddy border border-paddy/30',
  growing: 'bg-teal/15 text-teal border border-teal/40',
  ready: 'bg-turmeric/15 text-turmeric border border-turmeric/40',
  delivered: 'bg-teal text-white',
  paid: 'bg-teal text-white',
  'pending-sync': 'bg-turmeric/15 text-turmeric border border-turmeric/40',
  none: 'bg-surface-border/50 text-text-muted border border-surface-border',
  confirmed: 'bg-teal/15 text-teal border border-teal/40',
  valid: 'bg-teal/15 text-teal border border-teal/40',
  dismissed: 'bg-surface-border/50 text-text-muted border border-surface-border',
}

export default function Chip({ tone = 'open', children, className = '' }) {
  return <span className={`chip ${styles[tone] || styles.open} ${className}`}>{children}</span>
}
