import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Account } from '../../types'

const CHART_H = 260

function fmt(val: number) {
  if (Math.abs(val) >= 1000) return `₪${(val / 1000).toFixed(1)}K`
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
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

const NEG = '#dc2626'

export function SavingsBalancesBar({ accounts }: { accounts: Account[] }) {
  const data = accounts
    .filter(a => a.group === 'savings')
    .sort((a, b) => b.balance - a.balance)
    .map(a => ({ name: a.name, value: Math.round(a.balance) }))

  if (data.length === 0) return (
    <ChartCard title="חסכונות" color="text-teal-700">
      <BarChart data={[]}><Bar dataKey="v" /></BarChart>
    </ChartCard>
  )

  return (
    <ChartCard title="חסכונות" color="text-teal-700">
      <BarChart data={data} margin={{ top: 18, right: 6, left: 4, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} angle={-35} textAnchor="end" interval={0} height={56} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={54} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
        <ReferenceLine y={0} stroke="#bbb" />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#999', formatter: fmt }}>
          {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : '#134f5c'} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export function LongTermBalancesBar({ accounts }: { accounts: Account[] }) {
  const data = accounts
    .filter(a => a.group === 'long')
    .sort((a, b) => b.balance - a.balance)
    .map(a => ({ name: a.name, value: Math.round(a.balance) }))

  if (data.length === 0) return (
    <ChartCard title="מעטפות טווח ארוך" color="text-gray-700">
      <BarChart data={[]}><Bar dataKey="v" /></BarChart>
    </ChartCard>
  )

  return (
    <ChartCard title="מעטפות טווח ארוך" color="text-gray-700">
      <BarChart data={data} margin={{ top: 18, right: 6, left: 4, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} angle={-35} textAnchor="end" interval={0} height={56} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={54} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
        <ReferenceLine y={0} stroke="#bbb" />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#999', formatter: fmt }}>
          {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : '#434343'} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export { SavingsBalancesBar as CategoryPie }
