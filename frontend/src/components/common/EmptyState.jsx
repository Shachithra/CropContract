export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="text-center py-12 space-y-3">
      {Icon && <Icon size={32} className="mx-auto text-paddy/30" />}
      <p className="text-text-muted text-sm">{message}</p>
      {action}
    </div>
  )
}
