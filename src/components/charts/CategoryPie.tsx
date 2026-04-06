import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Account } from '../../types'

const CHART_H  = 280
const MARGIN   = { top: 8, right: 8, left: 8, bottom: 4 }
const X_HEIGHT = 72
const MAX_BAR  = 32
const NEG = '#dc2626'

function fmt(val: number) {
  if (Math.abs(val) >= 1000) return `₪${(val / 1000).toFixed(1)}K`
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

function makeTick(data: { name: string; value: number }[]) {
  return function CustomTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
    const item = data.find(d => d.name === payload.value)
    return (
      <g transform={`translate(${x},${y})`}>
        <text transform="rotate(-35)" textAnchor="end" fontSize={10} fill="#555" dy={14}>
          {payload.value}
        </text>
        {item && (
          <text transform="rotate(-35)" textAnchor="end" fontSize={9} fill="#888" dy={28}>
            {fmt(item.value)}
          </text>
        )}
      </g>
    )
  }
}

function ChartCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className={`text-sm font-bold mb-2 ${color}`}>{title}</h3>
      <div style={{ width: '100%', height: CHART_H }}>
        <ResponsiveContainer width="100%" height={CHART_H}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function SavingsBalancesBar({ accounts }: { accounts: Account[] }) {
  const data = accounts.filter(a => a.group === 'savings')
    .sort((a, b) => b.balance - a.balance)
    .map(a => ({ name: a.name, value: Math.round(a.balance) }))

  if (data.length === 0) return <ChartCard title="חסכונות" color="text-teal-700"><BarChart data={[]}><Bar dataKey="v" /></BarChart></ChartCard>
  return (
    <ChartCard title="חסכונות" color="text-teal-700">
      <BarChart data={data} margin={MARGIN} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={makeTick(data)} interval={0} height={X_HEIGHT} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={58} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
        <ReferenceLine y={0} stroke="#bbb" />
        <Bar dataKey="value" maxBarSize={MAX_BAR} radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : '#134f5c'} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export function LongTermBalancesBar({ accounts }: { accounts: Account[] }) {
  const data = accounts.filter(a => a.group === 'long')
    .sort((a, b) => b.balance - a.balance)
    .map(a => ({ name: a.name, value: Math.round(a.balance) }))

  if (data.length === 0) return <ChartCard title="מעטפות טווח ארוך" color="text-gray-700"><BarChart data={[]}><Bar dataKey="v" /></BarChart></ChartCard>
  return (
    <ChartCard title="מעטפות טווח ארוך" color="text-gray-700">
      <BarChart data={data} margin={MARGIN} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={makeTick(data)} interval={0} height={X_HEIGHT} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={58} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
        <ReferenceLine y={0} stroke="#bbb" />
        <Bar dataKey="value" maxBarSize={MAX_BAR} radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : '#434343'} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export { SavingsBalancesBar as CategoryPie }
