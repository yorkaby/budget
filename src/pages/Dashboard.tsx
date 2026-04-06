import { RefreshCw } from 'lucide-react'
import { useTransactions, useRefreshAll } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { buildAccounts, GROUP_LABELS } from '../lib/balances'
import { AccountGroupSection } from '../components/AccountCard'
import { ExpensesCategoryBar, IncomeCategoryBar } from '../components/charts/IncomeExpenseBar'
import { SavingsBalancesBar, LongTermBalancesBar } from '../components/charts/CategoryPie'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { filterByMonth, formatCurrency, getHebrewMonthName } from '../lib/dates'
import { Account, AccountGroup } from '../types'
import { parseDate } from '../lib/dates'

const GROUP_ORDER: AccountGroup[] = ['short', 'long', 'savings']

// Accounts that make up "עו"ש" (liquid checking position)
const CHECKING_ACCOUNTS = new Set(['דיסקונט', 'קניות', 'קניות זעתר', 'טיפוח', 'בילויים', 'בלתמים'])

export function Dashboard() {
  const { data: transactions = [], isLoading, error, dataUpdatedAt } = useTransactions()
  const { data: categories = [] } = useCategories()
  const refresh = useRefreshAll()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error).message} />

  const accounts = buildAccounts(transactions)
  const monthTx = filterByMonth(transactions, year, month)

  const totalIncome  = monthTx.filter(t => t.type === 'הכנסה').reduce((s, t) => s + t.amount, 0)
  const totalExpense = monthTx.filter(t => t.type === 'הוצאה').reduce((s, t) => s + t.amount, 0)

  // עו"ש: sum of checking envelope balances + all current-month transaction amounts
  const checkingBalance = accounts
    .filter(a => CHECKING_ACCOUNTS.has(a.name))
    .reduce((s, a) => s + a.balance, 0)
  const monthTxSum = monthTx.reduce((s, t) => s + t.amount, 0)
  const checkingTotal = checkingBalance + monthTxSum

  const byGroup: Record<AccountGroup, Account[]> = { short: [], long: [], savings: [] }
  accounts.forEach(a => byGroup[a.group].push(a))

  // Short-term total: use ILS balance for LAYA (balanceILS), regular balance for others
  const shortTotal = byGroup.short.reduce((s, a) => {
    if (a.balanceILS !== undefined) return s + a.balanceILS
    return s + a.balance
  }, 0)

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="p-3 md:p-6 max-w-screen-xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">דשבורד</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">{getHebrewMonthName(month, year)}</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden md:block text-xs text-gray-400">עודכן: {lastUpdated}</span>
          )}
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">רענן</span>
          </button>
        </div>
      </div>

      {/* Summary cards — 4 across */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        <SummaryCard
          label="הכנסות החודש"
          value={formatCurrency(totalIncome)}
          color="text-green-600"
          bg="bg-green-50"
          border="border-green-100"
        />
        <SummaryCard
          label="הוצאות החודש"
          value={formatCurrency(totalExpense)}
          color="text-red-600"
          bg="bg-red-50"
          border="border-red-100"
        />
        <SummaryCard
          label="נטו החודש"
          value={formatCurrency(totalIncome - totalExpense)}
          color={totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}
          bg="bg-blue-50"
          border="border-blue-100"
        />
        <SummaryCard
          label='עו"ש'
          value={formatCurrency(checkingTotal)}
          color={checkingTotal >= 0 ? 'text-gray-900' : 'text-red-600'}
          bg="bg-gray-50"
          border="border-gray-200"
          sub={`מעטפות: ${formatCurrency(checkingBalance)}`}
        />
      </div>

      {/* 4 charts in 2×2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
        <ExpensesCategoryBar transactions={transactions} categories={categories} year={year} month={month} />
        <IncomeCategoryBar   transactions={transactions} categories={categories} year={year} month={month} />
        <SavingsBalancesBar  accounts={accounts} />
        <LongTermBalancesBar accounts={accounts} />
      </div>

      {/* Account groups */}
      {GROUP_ORDER.map(group => {
        const accs = byGroup[group]
        if (!accs.length) return null
        // Use ILS total for short group
        const total = group === 'short'
          ? shortTotal
          : accs.reduce((s, a) => s + a.balance, 0)
        return (
          <AccountGroupSection
            key={group}
            title={GROUP_LABELS[group]}
            accounts={accs}
            total={total}
          />
        )
      })}
    </div>
  )
}

function SummaryCard({
  label, value, color, bg, border, sub,
}: {
  label: string
  value: string
  color: string
  bg: string
  border: string
  sub?: string
}) {
  return (
    <div className={`rounded-xl border p-3 md:p-5 ${bg} ${border}`}>
      <p className="text-xs md:text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-lg md:text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
