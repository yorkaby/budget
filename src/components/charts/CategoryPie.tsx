import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Transaction, Category } from '../../types'
import { parseDate } from '../../lib/dates'

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

function formatShekels(val: number) {
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

export function CategoryPie({
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
  // Build parent lookup
  const parentOf: Record<string, string> = {}
  categories.forEach(c => {
    parentOf[c.name] = c.parent || c.name
  })

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
    .slice(0, 9)
    .map(([name, value]) => ({ name, value: Math.round(value) }))

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-72">
        <p className="text-gray-400 text-sm">אין הוצאות החודש</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">הוצאות לפי קטגוריה</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatShekels(v)} />
          <Legend
            formatter={(val) => <span style={{ fontSize: 11 }}>{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
