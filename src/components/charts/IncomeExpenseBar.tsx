import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Transaction, Category } from '../../types'
import { parseDate } from '../../lib/dates'

const CHART_H  = 280
const MARGIN   = { top: 8, right: 8, left: 8, bottom: 4 }
const X_HEIGHT = 80
const MAX_BAR  = 32

function fmt(val: number) {
  if (Math.abs(val) >= 1000) return `₪${(val / 1000).toFixed(1)}K`
  return `₪${val.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

// Custom X-axis tick: name on first line, value on second line (in the empty space)
function makeTick(data: { name: string; value: number }[]) {
  return function CustomTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
    const item = data.find(d => d.name === payload.value)
    // dy=24 ensures text starts well below the axis line (not touching it)
    return (
      <g transform={`translate(${x},${y})`}>
        <text transform="rotate(-35)" textAnchor="end" fontSize={10} fill="#555" dy={24}>
          {payload.value}
        </text>
        {item && (
          <text transform="rotate(-35)" textAnchor="end" fontSize={9} fill="#888" dy={40}>
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

export function ExpensesCategoryBar({
  transactions, categories, year, month,
}: { transactions: Transaction[]; categories: Category[]; year: number; month: number }) {
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

  const data = Object.entries(totals).filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a).slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value) }))

  if (data.length === 0) return <ChartCard title="הוצאות" color="text-red-600"><BarChart data={[]}><Bar dataKey="v" /></BarChart></ChartCard>
  return (
    <ChartCard title="הוצאות" color="text-red-600">
      <BarChart data={data} margin={MARGIN} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={makeTick(data)} interval={0} height={X_HEIGHT} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={58} tickMargin={8} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'הוצאה']} />
        <Bar dataKey="value" maxBarSize={MAX_BAR} radius={[3, 3, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill="#dc2626" />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export function IncomeCategoryBar({
  transactions, categories, year, month,
}: { transactions: Transaction[]; categories: Category[]; year: number; month: number }) {
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

  const data = Object.entries(totals).filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value) }))

  if (data.length === 0) return <ChartCard title="הכנסות" color="text-green-600"><BarChart data={[]}><Bar dataKey="v" /></BarChart></ChartCard>
  return (
    <ChartCard title="הכנסות" color="text-green-600">
      <BarChart data={data} margin={MARGIN} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={makeTick(data)} interval={0} height={X_HEIGHT} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#666' }} width={58} tickMargin={8} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: number) => [`₪${v.toLocaleString('he-IL')}`, 'הכנסה']} />
        <Bar dataKey="value" maxBarSize={MAX_BAR} radius={[3, 3, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill="#16a34a" />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export { ExpensesCategoryBar as IncomeExpenseBar }
