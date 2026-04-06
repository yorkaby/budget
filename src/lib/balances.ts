import { Transaction, Account, AccountGroup } from '../types'

// All known accounts and their groups
export const ACCOUNT_GROUPS: Record<string, AccountGroup> = {
  // Short-term (current account envelopes - עו"ש)
  'דיסקונט': 'short',
  'מזומן': 'short',
  'קניות': 'short',
  'קניות זעתר': 'short',
  'טיפוח': 'short',
  'בילויים': 'short',
  'בלתמים': 'short',
  'LAYA': 'short',
  // Long-term (money market fund envelopes)
  'חיסכון לחופשה': 'long',
  'ספורט': 'long',
  'אירועים': 'long',
  'בריאות אישית': 'long',
  'בריאות זעתר': 'long',
  'חשבונות': 'long',
  'Spotify משפחתי': 'long',
  // Savings
  'חשבון מסחר': 'savings',
  'גמל להשקעה': 'savings',
  'קרן חירום': 'savings',
  'הלוואה דיסקונט': 'savings',
  'קרן פנסיה': 'savings',
  'קרן השתלמות': 'savings',
  'הלוואה אמא': 'savings',
}

export const GROUP_LABELS: Record<AccountGroup, string> = {
  short: 'טווח קצר (עו"ש)',
  long: 'טווח ארוך (קרן כספית)',
  savings: 'חסכונות והשקעות',
}

export const LOAN_ACCOUNTS = new Set(['הלוואה דיסקונט'])

export function computeBalance(accountName: string, transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    if (tx.type === 'הכנסה' && tx.from_account === accountName) {
      return sum + tx.amount
    }
    if (tx.type === 'הוצאה' && tx.from_account === accountName) {
      return sum - tx.amount
    }
    if (tx.type === 'העברה' && tx.to_account === accountName) {
      return sum + tx.amount
    }
    if (tx.type === 'העברה' && tx.from_account === accountName) {
      return sum - tx.amount
    }
    return sum
  }, 0)
}

export function buildAccounts(transactions: Transaction[]): Account[] {
  // Collect all unique account names from transactions
  const names = new Set<string>()
  transactions.forEach(tx => {
    if (tx.from_account) names.add(tx.from_account)
    if (tx.to_account) names.add(tx.to_account)
  })

  // Also include all known accounts even if not in transactions
  Object.keys(ACCOUNT_GROUPS).forEach(n => names.add(n))

  return Array.from(names)
    .filter(name => ACCOUNT_GROUPS[name])
    .map(name => ({
      name,
      group: ACCOUNT_GROUPS[name],
      balance: computeBalance(name, transactions),
      isLoan: LOAN_ACCOUNTS.has(name),
    }))
    .sort((a, b) => {
      const groupOrder: Record<AccountGroup, number> = { short: 0, long: 1, savings: 2 }
      return groupOrder[a.group] - groupOrder[b.group]
    })
}

export function getAccountTransactions(accountName: string, transactions: Transaction[]): Transaction[] {
  return transactions.filter(
    tx => tx.from_account === accountName || tx.to_account === accountName
  )
}
