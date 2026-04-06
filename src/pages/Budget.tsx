import { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { formatCurrency, filterByMonth } from '../lib/dates'
import { clsx } from 'clsx'

// Static budget configuration — mirrors the Google Sheets Budget tab
// These can later be made dynamic by parsing the Budget sheet

const SALARY = 9504.64

interface AllocationCategory {
  key: string
  label: string
  percent: number
  items: {
    name: string
    isFixed: boolean
    fixedAmount?: number
    dynamicPercent?: number
    account?: string
  }[]
}

const ALLOCATIONS: AllocationCategory[] = [
  {
    key: 'living',
    label: 'מחייה',
    percent: 50,
    items: [
      { name: 'שכר דירה', isFixed: true, fixedAmount: 3600 },
      { name: 'אינטרנט', isFixed: true, fixedAmount: 79 },
      { name: 'סלולר', isFixed: true, fixedAmount: 34.9 },
      { name: 'קניות', isFixed: false, dynamicPercent: 100, account: 'קניות' },
      { name: 'קניות זעתר', isFixed: false, dynamicPercent: 0, account: 'קניות זעתר' },
    ],
  },
  {
    key: 'investments',
    label: 'השקעות',
    percent: 20,
    items: [
      { name: 'גמל להשקעה', isFixed: true, fixedAmount: 1500, account: 'גמל להשקעה' },
      { name: 'החזר הלוואה', isFixed: true, fixedAmount: 833.33 },
    ],
  },
  {
    key: 'security',
    label: 'ביטחון / בריאות',
    percent: 20,
    items: [
      { name: 'מנורה ביטוח', isFixed: true, fixedAmount: 109.85 },
      { name: 'מכבי', isFixed: true, fixedAmount: 112.28 },
      { name: 'בריאות אישית', isFixed: false, dynamicPercent: 50, account: 'בריאות אישית' },
      { name: 'בריאות זעתר', isFixed: false, dynamicPercent: 50, account: 'בריאות זעתר' },
    ],
  },
  {
    key: 'leisure',
    label: 'הנאות / פנאי',
    percent: 10,
    items: [
      { name: 'בילויים', isFixed: false, dynamicPercent: 40, account: 'בילויים' },
      { name: 'ספורט', isFixed: false, dynamicPercent: 53, account: 'ספורט' },
      { name: 'בלתמים', isFixed: false, dynamicPercent: 0, account: 'בלתמים' },
      { name: 'Spotify', isFixed: true, fixedAmount: 43.9 },
      { name: 'LAYA', isFixed: true, fixedAmount: 0 },
    ],
  },
]

// Long-term envelope deposit targets
const LONG_TERM_DEPOSITS = [
  { account: 'חיסכון לחופשה', amount: 350.59 },
  { account: 'בריאות אישית', amount: 220 },
  { account: 'בריאות זעתר', amount: 280 },
  { account: 'אירועים', amount: 165 },
  { account: 'חשבונות', amount: 75 },
  { account: 'ספורט', amount: 500, isAbsorber: true },
]

// Short-term envelope deposit targets
const SHORT_TERM_DEPOSITS = [
  { account: 'קניות', amount: 500 },
  { account: 'קניות זעתר', amount: 250 },
  { account: 'טיפוח', amount: 250 },
  { account: 'בילויים', amount: 390 },
  { account: 'בלתמים', amount: 290.99, isAbsorber: true },
]

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

export function Budget() {
  const { data: transactions = [], isLoading, error } = useTransactions()
  const [salary, setSalary] = useState(SALARY)
  const [unitPrice, setUnitPrice] = useState(1.0)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthTx = useMemo(() => filterByMonth(transactions, year, month), [transactions, year, month])

  // Compute actual spending per account/category from transactions
  const actualByCategory = useMemo(() => {
    const totals: Record<string, number> = {}
    monthTx.forEach(tx => {
      if (tx.type === 'הוצאה' && tx.category) {
        totals[tx.category] = (totals[tx.category] || 0) + tx.amount
      }
    })
    return totals
  }, [monthTx])

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error).message} />

  const totalAllocPct = ALLOCATIONS.reduce((s, a) => s + a.percent, 0)

  // Long-term deposits with unit calculation
  const longTotalTarget = LONG_TERM_DEPOSITS.reduce((s, d) => s + d.amount, 0)
  const longTotalUnits = unitPrice > 0 ? Math.round(longTotalTarget / unitPrice) : 0
  const longActualCost = longTotalUnits * unitPrice
  const longDelta = longTotalTarget - longActualCost

  // Short-term deposits rounded to 5
  const shortRounded = SHORT_TERM_DEPOSITS.map(d => ({
    ...d,
    rounded: d.isAbsorber ? d.amount : roundTo5(d.amount),
  }))
  const shortNonAbsorberTotal = shortRounded.filter(d => !d.isAbsorber).reduce((s, d) => s + d.rounded, 0)
  const shortTotalTarget = SHORT_TERM_DEPOSITS.reduce((s, d) => s + d.amount, 0)
  const shortAbsorberAmount = shortTotalTarget - shortNonAbsorberTotal

  return (
    <div className="p-6 max-w-screen-xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ניהול תקציב</h1>

      {/* Salary input */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex items-center gap-6">
        <div>
          <label className="text-sm font-medium text-gray-700">משכורת נטו</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">₪</span>
            <input
              type="number"
              value={salary}
              onChange={e => setSalary(parseFloat(e.target.value) || 0)}
              className="text-xl font-bold text-gray-900 border-b-2 border-blue-400 bg-transparent w-32 focus:outline-none"
            />
          </div>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <label className="text-sm font-medium text-gray-700">סה"כ הקצאה</label>
          <p className={clsx(
            'text-xl font-bold mt-1',
            totalAllocPct === 100 ? 'text-green-600' : 'text-orange-500'
          )}>
            {totalAllocPct}% {totalAllocPct !== 100 && <span className="text-sm">(צריך להיות 100%)</span>}
          </p>
        </div>
      </div>

      {/* Allocation categories */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        {ALLOCATIONS.map(alloc => {
          const allocated = (alloc.percent / 100) * salary
          const fixedTotal = alloc.items
            .filter(i => i.isFixed)
            .reduce((s, i) => s + (i.fixedAmount ?? 0), 0)
          const dynamicPool = allocated - fixedTotal
          const itemsWithAmounts = alloc.items.map(item => ({
            ...item,
            amount: item.isFixed
              ? (item.fixedAmount ?? 0)
              : ((item.dynamicPercent ?? 0) / 100) * dynamicPool,
            actual: item.account ? (actualByCategory[item.account] ?? 0) : 0,
          }))
          const totalActual = itemsWithAmounts.reduce((s, i) => s + i.actual, 0)
          const delta = allocated - totalActual

          return (
            <div key={alloc.key} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className={clsx(
                'px-5 py-4 flex items-center justify-between',
                'bg-gradient-to-l from-blue-50 to-indigo-50 border-b border-gray-200'
              )}>
                <div>
                  <h2 className="font-bold text-gray-900">{alloc.label}</h2>
                  <p className="text-sm text-gray-500">{alloc.percent}% — {formatCurrency(allocated)}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">בפועל</p>
                  <p className={`font-bold ${Math.abs(delta) < 1 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCurrency(totalActual)}
                  </p>
                  <p className={`text-xs ${Math.abs(delta) < 1 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">פריט</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">מוקצה</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">בפועל</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithAmounts.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-4 py-2.5 text-gray-700">
                        {item.name}
                        {!item.isFixed && (
                          <span className="mr-1 text-xs text-gray-400">({item.dynamicPercent}%)</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 font-medium text-left">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className={`px-4 py-2.5 font-medium text-left ${item.actual > item.amount ? 'text-red-600' : 'text-gray-600'}`}>
                        {item.actual > 0 ? formatCurrency(item.actual) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      {/* Deposit Tables */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        {/* Long-term deposits */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-purple-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">הפקדות לטווח ארוך (קרן כספית)</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">מחיר יחידה:</label>
              <input
                type="number"
                step="0.001"
                value={unitPrice}
                onChange={e => setUnitPrice(parseFloat(e.target.value) || 1)}
                className="w-20 text-sm border border-gray-300 rounded px-2 py-1 text-left"
              />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-2 text-xs text-gray-500">חשבון</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">סכום יעד</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">יחידות</th>
              </tr>
            </thead>
            <tbody>
              {LONG_TERM_DEPOSITS.map((d, i) => {
                const units = unitPrice > 0 ? Math.round(d.amount / unitPrice) : 0
                return (
                  <tr key={i} className={clsx('border-b border-gray-50', d.isAbsorber && 'bg-yellow-50')}>
                    <td className="px-4 py-2.5 text-gray-700">
                      {d.account}
                      {d.isAbsorber && <span className="mr-1 text-xs text-orange-500">(סופג הפרש)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-left text-gray-900">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-2.5 text-left font-bold text-purple-700">{units.toLocaleString()}</td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                <td className="px-4 py-2.5 text-gray-800">סה"כ</td>
                <td className="px-4 py-2.5 text-left">{formatCurrency(longTotalTarget)}</td>
                <td className="px-4 py-2.5 text-left text-purple-700">{longTotalUnits.toLocaleString()} יח'</td>
              </tr>
              <tr className="text-xs">
                <td colSpan={3} className={`px-4 py-2 ${Math.abs(longDelta) < 0.01 ? 'text-green-600' : 'text-orange-500'}`}>
                  <Info className="w-3 h-3 inline ml-1" />
                  עלות בפועל: {formatCurrency(longActualCost)} | הפרש: {formatCurrency(Math.abs(longDelta))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Short-term deposits */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-teal-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">הפקדות לטווח קצר (עו"ש)</h2>
            <p className="text-xs text-gray-500 mt-0.5">מעוגל ל-5 ש"ח</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-2 text-xs text-gray-500">חשבון</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">יעד</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">מעוגל</th>
              </tr>
            </thead>
            <tbody>
              {SHORT_TERM_DEPOSITS.map((d, i) => {
                const rounded = d.isAbsorber ? shortAbsorberAmount : roundTo5(d.amount)
                return (
                  <tr key={i} className={clsx('border-b border-gray-50', d.isAbsorber && 'bg-yellow-50')}>
                    <td className="px-4 py-2.5 text-gray-700">
                      {d.account}
                      {d.isAbsorber && <span className="mr-1 text-xs text-orange-500">(סופג הפרש)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-left text-gray-500">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-2.5 text-left font-bold text-teal-700">{formatCurrency(rounded)}</td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                <td className="px-4 py-2.5 text-gray-800">סה"כ</td>
                <td className="px-4 py-2.5 text-left">{formatCurrency(shortTotalTarget)}</td>
                <td className="px-4 py-2.5 text-left text-teal-700">{formatCurrency(shortNonAbsorberTotal + shortAbsorberAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
