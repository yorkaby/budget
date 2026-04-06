import { useNavigate } from 'react-router-dom'
import { Account } from '../types'
import { formatCurrency } from '../lib/dates'
import { clsx } from 'clsx'

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
        isNegative
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : 'bg-white border-gray-200 hover:border-blue-300'
      )}
    >
      <p className="text-sm font-medium text-gray-600 truncate">{account.name}</p>
      <p className={clsx(
        'text-xl font-bold mt-1',
        isNegative ? 'text-red-600' : 'text-gray-900'
      )}>
        {formattedBalance}
      </p>
    </button>
  )
}

export function AccountGroupSection({
  title,
  accounts,
  total,
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
          isNegativeTotal
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
        )}>
          סה"כ: {formatCurrency(total)}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {accounts.map(acc => (
          <AccountCard key={acc.name} account={acc} />
        ))}
      </div>
    </div>
  )
}
