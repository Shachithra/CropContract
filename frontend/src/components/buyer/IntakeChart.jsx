import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/** Supply intake by crop (Recharts). */
export default function IntakeChart({ data }) {
  return (
    <div className="card-surface p-4">
      <p className="font-display font-bold text-sm mb-3">Supply intake by crop</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1B3E30" vertical={false} />
          <XAxis dataKey="crop" tick={{ fill: '#86EFAC', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#86EFAC', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(16,185,129,0.08)' }}
            contentStyle={{
              background: '#102A20',
              border: '1px solid #1B3E30',
              borderRadius: 12,
              color: '#F0FDF4',
              fontSize: 12,
            }}
          />
          <Bar dataKey="kg" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
