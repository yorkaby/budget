import { RefreshCw } from 'lucide-react'
import { useScheduled } from '../hooks/useScheduled'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { TypeBadge } from '../components/ui/Badge'
import { formatCurrency } from '../lib/dates'
import { clsx } from 'clsx'

export function Scheduled() {
  const { data: scheduled = [], isLoading, error, refetch } = useScheduled()

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error).message} />

  const totalIncome = scheduled.filter(t => t.type === 'הכנסה').reduce((s, t) => s + t.amount, 0)
  const totalExpense = scheduled.filter(t => t.type === 'הוצאה').reduce((s, t) => s + t.amount, 0)
  const totalTransfer = scheduled.filter(t => t.type === 'העברה').reduce((s, t) => s + t.amount, 0)

  // Split installments (have payment info) from regular
  const installments = scheduled.filter(t => t.totalPayments !== undefined)
  const regular = scheduled.filter(t => t.totalPayments === undefined)

  return (
    <div className="p-6 max-w-screen-xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">פעולות מתוזמנות</h1>
          <p className="text-sm text-gray-500">פעולות שמתבצעות בתחילת כל חודש</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> רענן
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700">הכנסות</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">הוצאות</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">העברות</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(totalTransfer)}</p>
        </div>
      </div>

      {/* Regular transactions */}
      {regular.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-800">פעולות קבועות ({regular.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-2 text-xs text-gray-500">סוג</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">מחשבון</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">לחשבון</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">קטגוריה</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">סכום</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">תיאור</th>
              </tr>
            </thead>
            <tbody>
              {regular.map((tx, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                  <td className="px-4 py-3 text-gray-800">{tx.from_account || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{tx.to_account || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{tx.category || '—'}</td>
                  <td className={clsx(
                    'px-4 py-3 font-semibold text-left',
                    tx.type === 'הכנסה' ? 'text-green-600' : tx.type === 'הוצאה' ? 'text-red-600' : 'text-blue-600'
                  )}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{tx.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Installment transactions */}
      {installments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-orange-50">
            <h2 className="font-semibold text-gray-800">תשלומים זמניים ({installments.length})</h2>
            <p className="text-xs text-gray-500 mt-0.5">ייעלמו אוטומטית עם השלמת כל התשלומים</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-4 py-2 text-xs text-gray-500">סוג</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">מחשבון</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">קטגוריה</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">סכום</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">תשלומים</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">תיאור</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((tx, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                  <td className="px-4 py-3 text-gray-800">{tx.from_account || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{tx.category || '—'}</td>
                  <td className={clsx(
                    'px-4 py-3 font-semibold text-left',
                    tx.type === 'הכנסה' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: tx.totalPayments ?? 0 }, (_, j) => (
                          <div
                            key={j}
                            className={clsx(
                              'w-2 h-2 rounded-full',
                              j < (tx.totalPayments ?? 0) - (tx.remainingPayments ?? 0)
                                ? 'bg-green-400'
                                : 'bg-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 mr-1">
                        {tx.remainingPayments}/{tx.totalPayments}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{tx.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
