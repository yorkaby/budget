import { useState, useMemo } from 'react'
import { RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import { useTransactions, useRefreshAll } from '../hooks/useTransactions'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { TypeBadge } from '../components/ui/Badge'
import { formatDate, formatCurrency, getMonthOptions } from '../lib/dates'
import { Transaction, TransactionType } from '../types'
import { parseDate } from '../lib/dates'

type SortKey = 'date' | 'amount'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

export function Transactions() {
  const { data: transactions = [], isLoading, error, dataUpdatedAt } = useTransactions()
  const refresh = useRefreshAll()

  const [filterType, setFilterType] = useState<TransactionType | ''>('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const monthOptions = useMemo(() => getMonthOptions(transactions), [transactions])

  const accounts = useMemo(() => {
    const s = new Set<string>()
    transactions.forEach(t => { if (t.from_account) s.add(t.from_account) })
    return Array.from(s).sort()
  }, [transactions])

  const cats = useMemo(() => {
    const s = new Set<string>()
    transactions.forEach(t => { if (t.category) s.add(t.category) })
    return Array.from(s).sort()
  }, [transactions])

  const filtered = useMemo(() => {
    let list = [...transactions]

    if (filterType) list = list.filter(t => t.type === filterType)
    if (filterAccount) list = list.filter(t => t.from_account === filterAccount || t.to_account === filterAccount)
    if (filterCategory) list = list.filter(t => t.category === filterCategory)
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number)
      list = list.filter(t => {
        const d = parseDate(t.date)
        return d && d.getFullYear() === y && d.getMonth() === m
      })
    }

    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') {
        const da = parseDate(a.date)?.getTime() ?? 0
        const db = parseDate(b.date)?.getTime() ?? 0
        cmp = da - db
      } else {
        cmp = a.amount - b.amount
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [transactions, filterType, filterAccount, filterCategory, filterMonth, sortKey, sortDir])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />
  }

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : null

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error).message} />

  return (
    <div className="p-6 max-w-screen-xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">טרנזקציות</h1>
          <p className="text-sm text-gray-500">{filtered.length} רשומות</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-xs text-gray-400">עודכן: {lastUpdated}</span>}
          <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> רענן
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <select
          value={filterMonth}
          onChange={e => { setFilterMonth(e.target.value); setPage(0) }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">כל החודשים</option>
          {monthOptions.map(o => (
            <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>{o.label}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value as TransactionType | ''); setPage(0) }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">כל הסוגים</option>
          <option value="הכנסה">הכנסה</option>
          <option value="הוצאה">הוצאה</option>
          <option value="העברה">העברה</option>
        </select>

        <select
          value={filterAccount}
          onChange={e => { setFilterAccount(e.target.value); setPage(0) }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">כל החשבונות</option>
          {accounts.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(0) }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">כל הקטגוריות</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {(filterType || filterAccount || filterCategory || filterMonth) && (
          <button
            onClick={() => { setFilterType(''); setFilterAccount(''); setFilterCategory(''); setFilterMonth(''); setPage(0) }}
            className="text-sm text-red-500 hover:text-red-700 px-2"
          >
            נקה פילטרים
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => toggleSort('date')}>
                תאריך <SortIcon k="date" />
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">סוג</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">מחשבון</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">לחשבון</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">קטגוריה</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => toggleSort('amount')}>
                סכום <SortIcon k="amount" />
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">הערות</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((tx: Transaction, i: number) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                <td className="px-4 py-3 text-gray-800">{tx.from_account}</td>
                <td className="px-4 py-3 text-gray-500">{tx.to_account || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{tx.category || '—'}</td>
                <td className={`px-4 py-3 font-semibold whitespace-nowrap ${tx.type === 'הכנסה' ? 'text-green-600' : tx.type === 'הוצאה' ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{tx.description || '—'}</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">אין תוצאות</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
            הקודם
          </button>
          <span className="text-sm text-gray-600">עמוד {page + 1} מתוך {totalPages}</span>
          <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
            הבא
          </button>
        </div>
      )}
    </div>
  )
}
