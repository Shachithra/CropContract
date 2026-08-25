import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import Button from '../common/Button.jsx'

export default function StatCard({ icon: Icon, value, label, tone = 'paddy', delay = 0, action }) {
  const toneColors = {
    paddy: 'bg-paddy/10 text-paddy',
    turmeric: 'bg-turmeric/10 text-turmeric',
    mint: 'bg-teal/10 text-teal',
    gold: 'bg-turmeric/10 text-turmeric',
    emerald: 'bg-teal/10 text-teal',
    red: 'bg-clay/10 text-clay',
  }

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl grid place-items-center ${toneColors[tone] || toneColors.paddy}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="font-display font-bold text-lg text-paddy">{value}</p>
      <p className="text-[11px] text-text-muted font-medium">{label}</p>
      {action}
    </Card>
  )
}
