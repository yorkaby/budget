import { RefreshCw } from 'lucide-react'
import { useScheduled } from '../hooks/useScheduled'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { formatCurrency } from '../lib/dates'
import { clsx } from 'clsx'
import { TimedTransaction } from '../types'

function isInstallment(tx: TimedTransaction) {
  return tx.description.includes('תשלום') || tx.totalPayments !== undefined
}

function ProgressDots({ tx }: { tx: TimedTransaction }) {
  if (!tx.totalPayments) return null
  const done = tx.totalPayments - (tx.remainingPayments ?? tx.totalPayments)
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: tx.totalPayments }, (_, j) => (
          <div
            key={j}
            className={clsx('w-2 h-2 rounded-full', j < done ? 'bg-green-400' : 'bg-gray-200')}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 mr-1">
        {tx.remainingPayments}/{tx.totalPayments}
      </span>
    </div>
  )
}

interface GroupCardProps {
  title: string
  subtitle: string
  total: number
  totalLabel: string
  colorClass: string
  children: React.ReactNode
}

function GroupCard({ title, subtitle, total, totalLabel, colorClass, children }: GroupCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
      <div className={clsx('px-5 py-4 border-b border-gray-200 flex items-center justify-between', colorClass)}>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-500">{totalLabel}</p>
          <p className="font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function Scheduled() {
  const { data: scheduled = [], isLoading, error, refetch } = useScheduled()

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error).message} />

  const income      = scheduled.filter(t => t.type === 'הכנסה' && !isInstallment(t))
  const transfers   = scheduled.filter(t => t.type === 'העברה')
  const fixedExp    = scheduled.filter(t => t.type === 'הוצאה' && !isInstallment(t))
  const installments = scheduled.filter(t => isInstallment(t))

  const totalIncome    = income.reduce((s, t) => s + t.amount, 0)
  const totalTransfers = transfers.reduce((s, t) => s + t.amount, 0)
  const totalFixed     = fixedExp.reduce((s, t) => s + t.amount, 0)
  const totalInstExp   = installments.filter(t => t.type === 'הוצאה').reduce((s, t) => s + t.amount, 0)
  const totalInstInc   = installments.filter(t => t.type === 'הכנסה').reduce((s, t) => s + t.amount, 0)

  // Net cash flow = income - fixed expenses - installment expenses + installment income
  // (Transfers are redistribution within accounts — not net loss)
  const netFlow = totalIncome + totalInstInc - totalFixed - totalInstExp

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">פעולות מתוזמנות</h1>
          <p className="text-sm text-gray-500">פעולות שמתבצעות בתחילת כל חודש</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> רענן
        </button>
      </div>

      {/* Cash flow summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700">הכנסות</p>
          <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(totalIncome + totalInstInc)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-700">הפקדות למעטפות</p>
          <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(totalTransfers)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-700">הוצאות קבועות</p>
          <p className="text-lg font-bold text-red-700 mt-1">{formatCurrency(totalFixed + totalInstExp)}</p>
        </div>
        <div className={clsx(
          'rounded-xl p-4 border',
          netFlow >= 0 ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'
        )}>
          <p className={clsx('text-xs', netFlow >= 0 ? 'text-gray-600' : 'text-orange-700')}>תזרים נטו</p>
          <p className={clsx('text-lg font-bold mt-1', netFlow >= 0 ? 'text-gray-900' : 'text-orange-700')}>
            {formatCurrency(netFlow)}
          </p>
        </div>
      </div>

      {/* ─── Income ──────────────────────────────────────────────── */}
      {income.length > 0 && (
        <GroupCard
          title="הכנסות"
          subtitle={`${income.length} פעולות`}
          total={totalIncome}
          totalLabel="סה״כ"
          colorClass="bg-green-50"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-right px-4 py-2">חשבון</th>
                <th className="text-right px-4 py-2">קטגוריה</th>
                <th className="text-left px-4 py-2">סכום</th>
                <th className="text-right px-4 py-2">תיאור</th>
              </tr>
            </thead>
            <tbody>
              {income.map((tx, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-800">{tx.from_account}</td>
                  <td className="px-4 py-2.5 text-gray-500">{tx.category || '—'}</td>
                  <td className="px-4 py-2.5 text-left font-semibold text-green-600">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{tx.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GroupCard>
      )}

      {/* ─── Envelope deposits (transfers) ───────────────────────── */}
      {transfers.length > 0 && (
        <GroupCard
          title="הפקדות למעטפות"
          subtitle={`${transfers.length} העברות`}
          total={totalTransfers}
          totalLabel="סה״כ"
          colorClass="bg-blue-50"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-right px-4 py-2">מחשבון</th>
                <th className="text-right px-4 py-2">לחשבון</th>
                <th className="text-left px-4 py-2">סכום</th>
                <th className="text-right px-4 py-2">תיאור</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tx, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{tx.from_account}</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium">{tx.to_account}</td>
                  <td className="px-4 py-2.5 text-left font-semibold text-blue-600">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{tx.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GroupCard>
      )}

      {/* ─── Fixed expenses ───────────────────────────────────────── */}
      {fixedExp.length > 0 && (
        <GroupCard
          title="הוצאות קבועות"
          subtitle={`${fixedExp.length} הוצאות`}
          total={totalFixed}
          totalLabel="סה״כ"
          colorClass="bg-red-50"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-right px-4 py-2">קטגוריה</th>
                <th className="text-left px-4 py-2">סכום</th>
                <th className="text-right px-4 py-2">תיאור</th>
              </tr>
            </thead>
            <tbody>
              {fixedExp.map((tx, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{tx.category || tx.from_account}</td>
                  <td className="px-4 py-2.5 text-left font-semibold text-red-600">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{tx.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GroupCard>
      )}

      {/* ─── Installments ─────────────────────────────────────────── */}
      {installments.length > 0 && (
        <GroupCard
          title="תשלומים זמניים"
          subtitle="יסתיימו אוטומטית"
          total={totalInstExp - totalInstInc}
          totalLabel="נטו"
          colorClass="bg-orange-50"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-right px-4 py-2">סוג</th>
                <th className="text-right px-4 py-2">חשבון</th>
                <th className="text-right px-4 py-2">קטגוריה</th>
                <th className="text-left px-4 py-2">סכום</th>
                <th className="text-right px-4 py-2">התקדמות</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((tx, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      tx.type === 'הכנסה' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{tx.from_account || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{tx.category || '—'}</td>
                  <td className={clsx(
                    'px-4 py-3 font-semibold text-left',
                    tx.type === 'הכנסה' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressDots tx={tx} />
                    {!tx.totalPayments && (
                      <span className="text-xs text-gray-400">{tx.description}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GroupCard>
      )}
    </div>
  )
}
