import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Transaction } from '../../types'
import { parseDate } from '../../lib/dates'

function formatShekels(val: number) {
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

export function IncomeExpenseBar({
  transactions,
  year,
  month,
}: {
  transactions: Transaction[]
  year: number
  month: number
}) {
  // Group by week within the month
  const weeks: Record<number, { income: number; expense: number }> = {
    1: { income: 0, expense: 0 },
    2: { income: 0, expense: 0 },
    3: { income: 0, expense: 0 },
    4: { income: 0, expense: 0 },
  }

  transactions.forEach(tx => {
    const d = parseDate(tx.date)
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) return
    const week = Math.min(Math.ceil(d.getDate() / 7), 4)
    if (tx.type === 'הכנסה') weeks[week].income += tx.amount
    if (tx.type === 'הוצאה') weeks[week].expense += tx.amount
  })

  const data = Object.entries(weeks).map(([w, vals]) => ({
    name: `שבוע ${w}`,
    הכנסות: Math.round(vals.income),
    הוצאות: Math.round(vals.expense),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">הכנסות vs הוצאות — לפי שבוע</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatShekels} tick={{ fontSize: 11 }} width={70} />
          <Tooltip formatter={(v: number) => formatShekels(v)} />
          <Legend />
          <Bar dataKey="הכנסות" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="הוצאות" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
