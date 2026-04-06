import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { useBudget } from '../hooks/useBudget'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { formatCurrency } from '../lib/dates'
import { clsx } from 'clsx'

const CAT_COLORS = [
  { bg: 'bg-blue-50',   border: 'border-blue-200',   header: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-400'   },
  { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-400' },
  { bg: 'bg-green-50',  border: 'border-green-200',  header: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-400'  },
  { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-400' },
]

export function Budget() {
  const { data, isLoading, error, refetch } = useBudget()
  const [editableSalary, setEditableSalary]       = useState(0)
  const [editableUnitPrice, setEditableUnitPrice] = useState(1)

  useEffect(() => {
    if (data) {
      setEditableSalary(data.salary)
      setEditableUnitPrice(data.unitPrice)
    }
  }, [data])

  // ALL hooks must be before any conditional returns
  const parsedTempOps = useMemo(() => (data?.tempOps ?? []).map(op => {
    const m = op.description.match(/תשלום\s+(\d+)\/(\d+)/)
    return {
      ...op,
      current: m ? parseInt(m[1]) : undefined,
      total:   m ? parseInt(m[2]) : undefined,
    }
  }), [data?.tempOps])

  if (isLoading) return <LoadingScreen />
  if (error || !data) return <ErrorScreen message={(error as Error)?.message ?? 'שגיאה'} />

  const longTermDeposits  = data.deposits.filter(d => d.isLongTerm)
  const shortTermDeposits = data.deposits.filter(d => !d.isLongTerm)

  const longRows = longTermDeposits.map(d => ({
    ...d,
    computedUnits: editableUnitPrice > 0 ? Math.round(d.amount / editableUnitPrice) : 0,
  }))
  const longTotalTarget = longRows.reduce((s, d) => s + d.amount, 0)
  const longTotalUnits  = longRows.reduce((s, d) => s + d.computedUnits, 0)
  const longActualCost  = longTotalUnits * editableUnitPrice
  const longDelta       = longTotalTarget - longActualCost

  const shortTotal   = shortTermDeposits.reduce((s, d) => s + d.amount, 0)
  const fixedTotal   = data.fixedOps.reduce((s, f) => s + f.amount, 0)
  const tempExpenses = data.tempOps.filter(t => t.type === 'הוצאה').reduce((s, t) => s + t.amount, 0)
  const tempIncome   = data.tempOps.filter(t => t.type === 'הכנסה').reduce((s, t) => s + t.amount, 0)
  const totalOut     = longTotalTarget + shortTotal + fixedTotal + tempExpenses - tempIncome
  const remaining    = editableSalary - totalOut

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto" dir="rtl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">תקציב חודשי</h1>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> רענן
        </button>
      </div>

      {/* ─── Parameters card ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex flex-wrap items-center gap-6">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">משכורת נטו</label>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-sm">₪</span>
            <input
              type="number"
              value={editableSalary}
              onChange={e => setEditableSalary(parseFloat(e.target.value) || 0)}
              className="text-xl font-bold text-gray-900 border-b-2 border-blue-400 bg-transparent w-32 focus:outline-none"
            />
          </div>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">מחיר יחידה (קרן כספית)</label>
          <input
            type="number"
            step="0.0001"
            value={editableUnitPrice}
            onChange={e => setEditableUnitPrice(parseFloat(e.target.value) || 1)}
            className="text-xl font-bold text-gray-900 border-b-2 border-purple-400 bg-transparent w-28 focus:outline-none"
          />
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">נשאר לאחר הקצאה</label>
          <p className={clsx(
            'text-xl font-bold',
            remaining >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* ─── Allocation categories ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {data.categories.map((cat, ci) => {
          const c = CAT_COLORS[ci % CAT_COLORS.length]
          const pct = cat.allocated > 0 ? Math.min(100, Math.round((cat.actualFromSheet / cat.allocated) * 100)) : 0
          const over = cat.actualFromSheet > cat.allocated
          return (
            <div key={ci} className={clsx('border rounded-xl overflow-hidden', c.border)}>
              {/* Card header */}
              <div className={clsx('px-4 py-3', c.header)}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                  <span className={clsx('text-xs font-semibold', c.text)}>
                    {formatCurrency(cat.allocated)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/70 rounded-full h-1.5 mt-2">
                  <div
                    className={clsx('h-1.5 rounded-full transition-all', over ? 'bg-red-500' : c.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">בפועל: {formatCurrency(cat.actualFromSheet)}</span>
                  <span className={clsx('text-xs font-medium', over ? 'text-red-600' : 'text-gray-500')}>
                    {pct}%
                  </span>
                </div>
              </div>
              {/* Items */}
              <div className="bg-white divide-y divide-gray-50">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-center justify-between px-4 py-2">
                    <span className="text-xs text-gray-600">{item.name}</span>
                    <span className="text-xs font-medium text-gray-800">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {cat.items.length === 0 && (
                  <div className="px-4 py-3 text-xs text-gray-400">אין פריטים</div>
                )}
              </div>
              {/* Actual vs allocated footer */}
              <div className={clsx(
                'px-4 py-2 flex items-center gap-1 text-xs',
                over ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
              )}>
                {over
                  ? <TrendingUp className="w-3 h-3 flex-shrink-0" />
                  : <TrendingDown className="w-3 h-3 flex-shrink-0" />}
                הפרש: {formatCurrency(cat.allocated - cat.actualFromSheet)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* ─── Long-term fund deposits ──────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-purple-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">הפקדות לקרן כספית</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                סה"כ {longTotalUnits.toLocaleString()} יחידות
              </p>
            </div>
            <p className="font-semibold text-purple-700">{formatCurrency(longTotalTarget)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-right px-4 py-2">מעטפה</th>
                <th className="text-left px-4 py-2">יחידות</th>
                <th className="text-left px-4 py-2">סכום</th>
              </tr>
            </thead>
            <tbody>
              {longRows.map((d, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{d.account}</td>
                  <td className="px-4 py-2.5 text-left text-purple-700 font-medium">
                    {d.computedUnits.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-left text-gray-900">{formatCurrency(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {Math.abs(longDelta) > 0.01 && (
            <div className="px-4 py-2 text-xs text-orange-500 border-t border-gray-100 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              עלות בפועל: {formatCurrency(longActualCost)} | הפרש עיגול: {formatCurrency(Math.abs(longDelta))}
            </div>
          )}
        </div>

        {/* ─── Short-term ILS deposits ──────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-teal-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">הפקדות לטווח קצר</h2>
              <p className="text-xs text-gray-500 mt-0.5">מעטפות עו"ש והשקעות</p>
            </div>
            <p className="font-semibold text-teal-700">{formatCurrency(shortTotal)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-right px-4 py-2">מעטפה</th>
                <th className="text-left px-4 py-2">סכום</th>
              </tr>
            </thead>
            <tbody>
              {shortTermDeposits.map((d, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{d.account}</td>
                  <td className="px-4 py-2.5 text-left text-gray-900 font-medium">{formatCurrency(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Fixed monthly operations ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 bg-red-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">פעולות קבועות חודשיות</h2>
            <p className="text-xs text-gray-500 mt-0.5">הוצאות והחזרים קבועים</p>
          </div>
          <p className="font-semibold text-red-700">{formatCurrency(fixedTotal)}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {data.fixedOps.map((op, i) => (
            <div key={i} className="px-4 py-3 border-b border-l border-gray-100">
              <p className="text-xs text-gray-500">{op.name}</p>
              <p className="font-semibold text-gray-900 mt-0.5">{formatCurrency(op.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Active installments ──────────────────────────────────── */}
      {parsedTempOps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-orange-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">פעולות זמניות פעילות</h2>
              <p className="text-xs text-gray-500 mt-0.5">תשלומים ומענקים זמניים</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-right px-4 py-2">סוג</th>
                <th className="text-right px-4 py-2">תיאור</th>
                <th className="text-left px-4 py-2">סכום</th>
                <th className="text-right px-4 py-2">התקדמות</th>
              </tr>
            </thead>
            <tbody>
              {parsedTempOps.map((op, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      op.type === 'הכנסה' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {op.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{op.description}</td>
                  <td className={clsx(
                    'px-4 py-3 font-semibold text-left',
                    op.type === 'הכנסה' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(op.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {op.total !== undefined && (
                      <div className="flex items-center gap-1 justify-end">
                        <div className="flex gap-0.5">
                          {Array.from({ length: op.total }, (_, j) => (
                            <div
                              key={j}
                              className={clsx(
                                'w-2 h-2 rounded-full',
                                j < (op.current! - 1) ? 'bg-green-400'
                                  : j < op.current! ? 'bg-blue-400'
                                  : 'bg-gray-200'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 mr-1">{op.current}/{op.total}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
