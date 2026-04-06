import { RefreshCw } from 'lucide-react'
import { useTransactions, useRefreshAll } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { buildAccounts, GROUP_LABELS } from '../lib/balances'
import { AccountGroupSection } from '../components/AccountCard'
import { IncomeExpenseBar } from '../components/charts/IncomeExpenseBar'
import { CategoryPie } from '../components/charts/CategoryPie'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { filterByMonth, formatCurrency, getHebrewMonthName } from '../lib/dates'
import { Account, AccountGroup } from '../types'

const GROUP_ORDER: AccountGroup[] = ['short', 'long', 'savings']

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

  const totalIncome = monthTx.filter(t => t.type === 'הכנסה').reduce((s, t) => s + t.amount, 0)
  const totalExpense = monthTx.filter(t => t.type === 'הוצאה').reduce((s, t) => s + t.amount, 0)

  const byGroup: Record<AccountGroup, Account[]> = { short: [], long: [], savings: [] }
  accounts.forEach(a => byGroup[a.group].push(a))

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="p-6 max-w-screen-xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">דשבורד</h1>
          <p className="text-sm text-gray-500 mt-0.5">{getHebrewMonthName(month, year)}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">עודכן: {lastUpdated}</span>
          )}
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            רענן
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">הכנסות החודש</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">הוצאות החודש</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">נטו החודש</p>
          <p className={`text-2xl font-bold mt-1 ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <IncomeExpenseBar transactions={transactions} year={year} month={month} />
        <CategoryPie transactions={transactions} categories={categories} year={year} month={month} />
      </div>

      {/* Accounts by group */}
      {GROUP_ORDER.map(group => {
        const accs = byGroup[group]
        if (!accs.length) return null
        const total = accs.reduce((s, a) => s + a.balance, 0)
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
