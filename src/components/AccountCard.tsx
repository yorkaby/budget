import { useNavigate } from 'react-router-dom'
import { Account, AccountGroup } from '../types'
import { formatCurrency } from '../lib/dates'
import { clsx } from 'clsx'

const GROUP_COLOR: Record<AccountGroup, string> = {
  short:   '#4285f4',
  long:    '#434343',
  savings: '#134f5c',
}

function AccountRow({ account, index }: { account: Account; index: number }) {
  const navigate = useNavigate()
  const isEur = account.eurBalance !== undefined
  const displayBalance = isEur ? account.eurBalance! : account.balance

  const formatted = isEur
    ? `€${Math.abs(displayBalance).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : formatCurrency(account.balance)

  const bg = index % 2 === 0 ? '#ffffff' : '#f3f3f3'

  return (
    <button
      onClick={() => navigate(`/accounts/${encodeURIComponent(account.name)}`)}
      className="w-full flex items-center justify-between px-3 py-2.5 border-b border-gray-100 hover:brightness-95 transition-all"
      style={{ backgroundColor: bg }}
    >
      <span className="text-sm font-medium text-gray-800">{account.name}</span>
      <span className="text-sm font-semibold tabular-nums text-gray-900">{formatted}</span>
    </button>
  )
}

function EmptyRow({ index }: { index: number }) {
  const bg = index % 2 === 0 ? '#ffffff' : '#f3f3f3'
  return <div className="px-3 py-2.5 border-b border-gray-100" style={{ backgroundColor: bg }}>&nbsp;</div>
}

export function AccountGroupColumn({
  title, accounts, total, group,
}: {
  title: string
  accounts: Account[]
  total: number
  group: AccountGroup
}) {
  const color = GROUP_COLOR[group]

  return (
    <div className="flex-1 min-w-0 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 font-bold text-sm text-center text-white shrink-0" style={{ backgroundColor: color }}>
        {title}
      </div>
      {/* Rows — flex-1 so they fill available height, pushing total to bottom */}
      <div className="flex-1 bg-white">
        {accounts.map((acc, i) => <AccountRow key={acc.name} account={acc} index={i} />)}
      </div>
      {/* Total — always pinned to bottom */}
      <div
        className="px-3 py-2.5 flex items-center justify-between font-bold text-sm text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        <span>סה"כ</span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

// ── legacy exports ────────────────────────────────────────────────────────────

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
        isNegative ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-blue-300',
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
  title: string; accounts: Account[]; total: number
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
