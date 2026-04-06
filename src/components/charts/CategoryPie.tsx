import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Account } from '../../types'

function fmt(val: number) {
  if (Math.abs(val) >= 1000) return `₪${(val / 1000).toFixed(1)}K`
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

function ChartWrapper({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <h3 className={`text-sm font-bold mb-3 ${color}`}>{title}</h3>
      <div style={{ height: 260 }}>
        {children}
      </div>
    </div>
  )
}

const TEAL = '#0d9488'
const DARK = '#374151'
const NEG  = '#dc2626'

// Savings account balances — teal/red bars
export function SavingsBalancesBar({ accounts }: { accounts: Account[] }) {
  const data = accounts
    .filter(a => a.group === 'savings')
    .sort((a, b) => b.balance - a.balance)
    .map(a => ({ name: a.name, value: Math.round(a.balance) }))

  return (
    <ChartWrapper title="חסכונות" color="text-teal-700">
      {data.length === 0
        ? <div className="h-full flex items-center justify-center text-gray-400 text-sm">אין נתונים</div>
        : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#444' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={56} />
              <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
              <ReferenceLine y={0} stroke="#aaa" />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#888', formatter: fmt }}>
                {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : TEAL} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
    </ChartWrapper>
  )
}

// Long-term envelope balances — dark bars
export function LongTermBalancesBar({ accounts }: { accounts: Account[] }) {
  const data = accounts
    .filter(a => a.group === 'long')
    .sort((a, b) => b.balance - a.balance)
    .map(a => ({ name: a.name, value: Math.round(a.balance) }))

  return (
    <ChartWrapper title="מעטפות טווח ארוך" color="text-gray-700">
      {data.length === 0
        ? <div className="h-full flex items-center justify-center text-gray-400 text-sm">אין נתונים</div>
        : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#444' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={56} />
              <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
              <ReferenceLine y={0} stroke="#aaa" />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#888', formatter: fmt }}>
                {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : DARK} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
    </ChartWrapper>
  )
}

export { SavingsBalancesBar as CategoryPie }
