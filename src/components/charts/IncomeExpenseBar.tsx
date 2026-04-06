import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Transaction, Category } from '../../types'
import { parseDate } from '../../lib/dates'

function fmt(val: number) {
  if (Math.abs(val) >= 1000) return `₪${(val / 1000).toFixed(1)}K`
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

// Expenses by category — vertical red bars
export function ExpensesCategoryBar({
  transactions,
  categories,
  year,
  month,
}: {
  transactions: Transaction[]
  categories: Category[]
  year: number
  month: number
}) {
  const parentOf: Record<string, string> = {}
  categories.forEach(c => { parentOf[c.name] = c.parent || c.name })

  const totals: Record<string, number> = {}
  transactions.forEach(tx => {
    if (tx.type !== 'הוצאה') return
    const d = parseDate(tx.date)
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) return
    const parent = parentOf[tx.category] || tx.category || 'אחר'
    totals[parent] = (totals[parent] || 0) + tx.amount
  })

  const data = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value) }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
        הוצאות
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
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={48} />
              <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'הוצאה']} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#666', formatter: fmt }}>
                {data.map((_, i) => <Cell key={i} fill="#dc2626" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  )
}

// Income by category — vertical green bars
export function IncomeCategoryBar({
  transactions,
  categories,
  year,
  month,
}: {
  transactions: Transaction[]
  categories: Category[]
  year: number
  month: number
}) {
  const parentOf: Record<string, string> = {}
  categories.forEach(c => { parentOf[c.name] = c.parent || c.name })

  const totals: Record<string, number> = {}
  transactions.forEach(tx => {
    if (tx.type !== 'הכנסה') return
    const d = parseDate(tx.date)
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) return
    const parent = parentOf[tx.category] || tx.category || 'הכנסה'
    totals[parent] = (totals[parent] || 0) + tx.amount
  })

  const data = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value) }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-green-600 mb-3 flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
        הכנסות
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
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={48} />
              <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'הכנסה']} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#666', formatter: fmt }}>
                {data.map((_, i) => <Cell key={i} fill="#16a34a" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  )
}

// Keep old export name as alias for backward compat
export { ExpensesCategoryBar as IncomeExpenseBar }
