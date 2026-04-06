import { clsx } from 'clsx'
import { TransactionType } from '../../types'

const typeColors: Record<TransactionType, string> = {
  'הכנסה': 'bg-green-100 text-green-700',
  'הוצאה': 'bg-red-100 text-red-700',
  'העברה': 'bg-blue-100 text-blue-700',
}

export function TypeBadge({ type }: { type: TransactionType }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', typeColors[type])}>
      {type}
    </span>
  )
}

export function Badge({ label, color = 'gray' }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700`}>
      {label}
    </span>
  )
}
