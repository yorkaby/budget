import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Transaction, Category } from '../../types'
import { parseDate } from '../../lib/dates'

const CHART_H = 260

function fmt(val: number) {
  if (Math.abs(val) >= 1000) return `₪${(val / 1000).toFixed(1)}K`
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

function ChartCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className={`text-sm font-bold mb-2 ${color}`}>{title}</h3>
      {/* fixed-height wrapper — ResponsiveContainer needs a sized parent */}
      <div style={{ width: '100%', height: CHART_H }}>
        <ResponsiveContainer width="100%" height={CHART_H}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ExpensesCategoryBar({
  transactions, categories, year, month,
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

  if (data.length === 0) return (
    <ChartCard title="הוצאות" color="text-red-600">
      <BarChart data={[]}><Bar dataKey="v" /></BarChart>
    </ChartCard>
  )

  return (
    <ChartCard title="הוצאות" color="text-red-600">
      <BarChart data={data} margin={{ top: 18, right: 6, left: 4, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} angle={-35} textAnchor="end" interval={0} height={56} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={54} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'הוצאה']} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#999', formatter: fmt }}>
          {data.map((_, i) => <Cell key={i} fill="#dc2626" />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export function IncomeCategoryBar({
  transactions, categories, year, month,
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

  if (data.length === 0) return (
    <ChartCard title="הכנסות" color="text-green-600">
      <BarChart data={[]}><Bar dataKey="v" /></BarChart>
    </ChartCard>
  )

  return (
    <ChartCard title="הכנסות" color="text-green-600">
      <BarChart data={data} margin={{ top: 18, right: 6, left: 4, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} angle={-35} textAnchor="end" interval={0} height={56} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={54} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'הכנסה']} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#999', formatter: fmt }}>
          {data.map((_, i) => <Cell key={i} fill="#16a34a" />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export { ExpensesCategoryBar as IncomeExpenseBar }
