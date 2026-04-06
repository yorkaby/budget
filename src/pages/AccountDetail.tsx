import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import { computeBalance, getAccountTransactions } from '../lib/balances'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { TypeBadge } from '../components/ui/Badge'
import { formatDate, formatCurrency } from '../lib/dates'
import { clsx } from 'clsx'

export function AccountDetail() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const { data: transactions = [], isLoading, error } = useTransactions()

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error).message} />

  const accountName = decodeURIComponent(name ?? '')
  const accountTx = getAccountTransactions(accountName, transactions)
  const balance = computeBalance(accountName, transactions)
  const isNegative = balance < 0

  // Sort by date desc
  const sorted = [...accountTx].sort((a, b) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    return db - da
  })

  return (
    <div className="p-6 max-w-screen-lg mx-auto" dir="rtl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לדשבורד
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{accountName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sorted.length} טרנזקציות</p>
        </div>
        <div className={clsx(
          'text-3xl font-bold px-5 py-3 rounded-xl',
          isNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
        )}>
          {formatCurrency(balance)}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">תאריך</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">סוג</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">מחשבון</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">לחשבון</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">קטגוריה</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">סכום</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">השפעה</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">הערות</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx, i) => {
              const isCredit = (tx.type === 'הכנסה' && tx.from_account === accountName)
                || (tx.type === 'העברה' && tx.to_account === accountName)
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                  <td className="px-4 py-3 text-gray-800">{tx.from_account}</td>
                  <td className="px-4 py-3 text-gray-500">{tx.to_account || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{tx.category || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(tx.amount)}</td>
                  <td className={`px-4 py-3 font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{tx.description || '—'}</td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">אין טרנזקציות</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
