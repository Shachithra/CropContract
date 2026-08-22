const styles = {
  open: 'bg-emerald/15 text-mint border border-emerald/40',
  fulfilled: 'bg-emerald text-forest',
  closed: 'bg-white/5 text-textmuted border border-surface-border',
  pending: 'bg-gold/15 text-gold border border-gold/40',
  synced: 'bg-mint/15 text-mint border border-mint/40',
  low: 'bg-emerald/15 text-mint border border-emerald/40',
  moderate: 'bg-gold/15 text-gold border border-gold/40',
  high: 'bg-alert/15 text-alert border border-alert/50',
  gold: 'bg-gold/15 text-gold border border-gold/40',
}

export default function Chip({ tone = 'open', children, className = '' }) {
  return <span className={`chip ${styles[tone] || styles.open} ${className}`}>{children}</span>
}
