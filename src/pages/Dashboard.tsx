import { RefreshCw } from 'lucide-react'
import { useTransactions, useRefreshAll } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { buildAccounts, GROUP_LABELS, GROUP_ACCOUNT_ORDER } from '../lib/balances'
import { AccountGroupColumn } from '../components/AccountCard'
import { ExpensesCategoryBar, IncomeCategoryBar } from '../components/charts/IncomeExpenseBar'
import { SavingsBalancesBar, LongTermBalancesBar } from '../components/charts/CategoryPie'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'
import { filterByMonth, formatCurrency, getHebrewMonthName } from '../lib/dates'
import { Account, AccountGroup } from '../types'
import { useEurRate } from '../hooks/useEurRate'

const GROUP_ORDER: AccountGroup[] = ['short', 'long', 'savings']
const CHECKING_ACCOUNTS = new Set(['דיסקונט', 'קניות', 'קניות זעתר', 'טיפוח', 'בילויים', 'בלתמים'])

export function Dashboard() {
  const { data: transactions = [], isLoading, error, dataUpdatedAt } = useTransactions()
  const { data: categories = [] } = useCategories()
  const { data: eurRate } = useEurRate()
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

  // עו"ש
  const checkingBalance = accounts
    .filter(a => CHECKING_ACCOUNTS.has(a.name))
    .reduce((s, a) => s + a.balance, 0)
  const monthTagSum = transactions
    .filter(t => t.monthTag === month + 1)
    .reduce((s, t) => s + t.amount, 0)
  const checkingTotal = checkingBalance + monthTagSum

  // Group accounts, sorted by canonical order
  const byGroup: Record<AccountGroup, Account[]> = { short: [], long: [], savings: [] }
  accounts.forEach(a => byGroup[a.group].push(a))
  GROUP_ORDER.forEach(g => {
    const order = GROUP_ACCOUNT_ORDER[g]
    byGroup[g].sort((a, b) => {
      const ia = order.indexOf(a.name)
      const ib = order.indexOf(b.name)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
  })

  // Group totals
  const shortTotal = byGroup.short.reduce((s, a) => {
    if (a.eurBalance !== undefined) {
      const rate = eurRate ?? a.balanceILS! / (a.eurBalance || 1)
      return s + a.eurBalance * rate
    }
    return s + a.balance
  }, 0)
  const longTotal    = byGroup.long.reduce((s, a) => s + a.balance, 0)
  const savingsTotal = byGroup.savings.reduce((s, a) => s + a.balance, 0)
  const wealthTotal  = shortTotal + longTotal + savingsTotal

  const maxRows = Math.max(...GROUP_ORDER.map(g => byGroup[g].length))

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
          {lastUpdated && <span className="hidden md:block text-xs text-gray-400">עודכן: {lastUpdated}</span>}
          <button onClick={refresh} className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">רענן</span>
          </button>
        </div>
      </div>

      {/* 1. עו"ש — single wide card at the very top */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 mb-4 md:mb-6 flex items-center gap-6">
        <div>
          <p className="text-xs md:text-sm text-gray-500 font-medium">עו"ש</p>
          <p className={`text-2xl md:text-3xl font-bold mt-0.5 ${checkingTotal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(checkingTotal)}
          </p>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <p className="text-xs text-gray-400">מעטפות בלבד</p>
          <p className="text-base font-semibold text-gray-600 mt-0.5">{formatCurrency(checkingBalance)}</p>
        </div>
      </div>

      {/* 2. Account group columns */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
        {GROUP_ORDER.map(group => {
          const accs = byGroup[group]
          if (!accs.length) return null
          const total = group === 'short' ? shortTotal : group === 'long' ? longTotal : savingsTotal
          return (
            <AccountGroupColumn
              key={group}
              group={group}
              title={GROUP_LABELS[group]}
              accounts={accs}
              total={total}
              targetRows={maxRows}
            />
          )
        })}
      </div>

      {/* 3. Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        <SummaryCard label="הכנסות החודש" value={formatCurrency(totalIncome)}
          color="text-green-600" bg="bg-green-50" border="border-green-100" />
        <SummaryCard label="הוצאות החודש" value={formatCurrency(totalExpense)}
          color="text-red-600" bg="bg-red-50" border="border-red-100" />
        <SummaryCard label="נטו החודש" value={formatCurrency(totalIncome - totalExpense)}
          color={totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}
          bg="bg-blue-50" border="border-blue-100" />
        <SummaryCard label="סך ההון" value={formatCurrency(wealthTotal)}
          color="text-gray-900" bg="bg-gray-50" border="border-gray-200"
          sub={`קצר ${formatCurrency(shortTotal)} · ארוך ${formatCurrency(longTotal)}`} />
      </div>

      {/* 4. Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <ExpensesCategoryBar transactions={transactions} categories={categories} year={year} month={month} />
        <IncomeCategoryBar   transactions={transactions} categories={categories} year={year} month={month} />
        <SavingsBalancesBar  accounts={accounts} />
        <LongTermBalancesBar accounts={accounts} />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, bg, border, sub }: {
  label: string; value: string; color: string; bg: string; border: string; sub?: string
}) {
  return (
    <div className={`rounded-xl border p-3 md:p-5 ${bg} ${border}`}>
      <p className="text-xs md:text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-lg md:text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
