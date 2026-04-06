import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Account } from '../../types'

function fmt(val: number) {
  if (Math.abs(val) >= 1000) return `₪${(val / 1000).toFixed(1)}K`
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-teal-700 mb-3 flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-teal-600 inline-block" />
        חסכונות
      </h3>
      {data.length === 0
        ? <div className="h-44 flex items-center justify-center text-gray-400 text-sm">אין נתונים</div>
        : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#555' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                height={48}
              />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={52} />
              <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : TEAL} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  )
}

// Long-term envelope balances — dark bars
export function LongTermBalancesBar({ accounts }: { accounts: Account[] }) {
  const data = accounts
    .filter(a => a.group === 'long')
    .sort((a, b) => b.balance - a.balance)
    .map(a => ({ name: a.name, value: Math.round(a.balance) }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-gray-600 inline-block" />
        מעטפות טווח ארוך
      </h3>
      {data.length === 0
        ? <div className="h-44 flex items-center justify-center text-gray-400 text-sm">אין נתונים</div>
        : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#555' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                height={48}
              />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={52} />
              <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'יתרה']} />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? NEG : DARK} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  )
}

// Keep old export name for backward compat
export { SavingsBalancesBar as CategoryPie }
