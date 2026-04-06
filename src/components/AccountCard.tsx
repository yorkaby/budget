import { useNavigate } from 'react-router-dom'
import { Account, AccountGroup } from '../types'
import { formatCurrency } from '../lib/dates'
import { clsx } from 'clsx'

// Custom brand colours per group
const GROUP_COLOR: Record<AccountGroup, string> = {
  short:   '#4285f4',
  long:    '#434343',
  savings: '#134f5c',
}

function AccountRow({ account }: { account: Account }) {
  const navigate = useNavigate()
  const isEur = account.eurBalance !== undefined
  const displayBalance = isEur ? account.eurBalance! : account.balance
  const isNegative = displayBalance < 0

  const formatted = isEur
    ? `€${Math.abs(displayBalance).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${isNegative ? '-' : ''}`
    : formatCurrency(account.balance)

  return (
    <button
      onClick={() => navigate(`/accounts/${encodeURIComponent(account.name)}`)}
      className="w-full flex items-center justify-between px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <span className={clsx('text-sm font-medium', isNegative ? 'text-red-600' : 'text-gray-700')}>
        {account.name}
      </span>
      <span className={clsx('text-sm font-semibold tabular-nums', isNegative ? 'text-red-600' : 'text-gray-900')}>
        {formatted}
      </span>
    </button>
  )
}

function EmptyRow() {
  return <div className="px-3 py-2.5 border-b border-gray-100">&nbsp;</div>
}

export function AccountGroupColumn({
  title,
  accounts,
  total,
  group,
  targetRows,
}: {
  title: string
  accounts: Account[]
  total: number
  group: AccountGroup
  targetRows: number
}) {
  const color = GROUP_COLOR[group]
  const padCount = Math.max(0, targetRows - accounts.length)
  const isNegativeTotal = total < 0

  return (
    <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="px-3 py-2.5 border-b font-bold text-sm text-center text-white"
        style={{ backgroundColor: color }}
      >
        {title}
      </div>
      {/* Account rows */}
      <div>
        {accounts.map(acc => <AccountRow key={acc.name} account={acc} />)}
        {Array.from({ length: padCount }, (_, i) => <EmptyRow key={`pad-${i}`} />)}
      </div>
      {/* Total */}
      <div
        className="px-3 py-2.5 flex items-center justify-between border-t font-bold text-sm text-white"
        style={{ backgroundColor: color }}
      >
        <span>סה"כ</span>
        <span className={clsx('tabular-nums', isNegativeTotal ? 'opacity-80' : '')}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}

// ── legacy exports kept for pages that still import them ──────────────────────

export function AccountCard({ account }: { account: Account }) {
  const navigate = useNavigate()
  const isEur = account.eurBalance !== undefined
  const displayBalance = isEur ? account.eurBalance! : account.balance
  const isNegative = displayBalance < 0

  const formattedBalance = isEur
    ? `€${Math.abs(displayBalance).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${isNegative ? '-' : ''}`
    : formatCurrency(account.balance)

  return (
    <button
      onClick={() => navigate(`/accounts/${encodeURIComponent(account.name)}`)}
      className={clsx(
        'w-full text-right p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        isNegative ? 'bg-red-50 border-red-200 hover:border-red-300' : 'bg-white border-gray-200 hover:border-blue-300',
      )}
    >
      <p className="text-sm font-medium text-gray-600 truncate">{account.name}</p>
      <p className={clsx('text-xl font-bold mt-1', isNegative ? 'text-red-600' : 'text-gray-900')}>
        {formattedBalance}
      </p>
    </button>
  )
}

export function AccountGroupSection({
  title, accounts, total,
}: {
  title: string
  accounts: Account[]
  total: number
}) {
  const isNegativeTotal = total < 0
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <span className={clsx(
          'text-sm font-bold px-3 py-1 rounded-full',
          isNegativeTotal ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700',
        )}>
          סה"כ: {formatCurrency(total)}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {accounts.map(acc => <AccountCard key={acc.name} account={acc} />)}
      </div>
    </div>
  )
}
