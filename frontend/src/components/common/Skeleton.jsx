export default function Skeleton({ className = '', lines = 1 }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-surface-border/60"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  )
}
