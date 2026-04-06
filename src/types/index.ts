export type TransactionType = 'הכנסה' | 'הוצאה' | 'העברה'

export interface Transaction {
  timestamp: string
  date: string
  type: TransactionType
  from_account: string
  to_account: string
  category: string
  amount: number
  description: string
}

export type AccountGroup = 'short' | 'long' | 'savings'

export interface Account {
  name: string
  group: AccountGroup
  balance: number
  isLoan?: boolean
  eurBalance?: number   // only for EUR accounts (LAYA)
  balanceILS?: number   // ILS equivalent for EUR accounts
}

export interface Category {
  name: string
  parent: string
  type: 'הכנסה' | 'הוצאה' | ''
}

export interface BudgetAllocation {
  name: string
  label: string
  percent: number
  amount: number
  actualAmount: number
  absorber?: boolean
  items: BudgetItem[]
}

export interface BudgetItem {
  name: string
  isFixed: boolean
  fixedAmount?: number
  dynamicPercent?: number
  computedAmount: number
  account?: string
}

export interface DepositEntry {
  account: string
  amount: number
  units?: number
  isAbsorber?: boolean
}

export interface TimedTransaction {
  type: TransactionType
  from_account: string
  to_account: string
  category: string
  amount: number
  description: string
  startDate?: string
  totalPayments?: number
  remainingPayments?: number
}

export interface ScheduledTransaction {
  type: TransactionType
  from_account: string
  to_account: string
  category: string
  amount: number
  description: string
  source: 'budget' | 'fixed' | 'installment'
  remainingPayments?: number
}
