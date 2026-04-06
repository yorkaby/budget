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
export const EUR_ACCOUNTS = new Set(['LAYA'])

// דיסקונט adds ₪80 after the 17th of the month (expected upcoming income)
const DISKONT_LATE_MONTH_BONUS = 80
export const DISKONT_ACCOUNT = 'דיסקונט'

export function computeBalance(accountName: string, transactions: Transaction[]): number {
  const base = transactions.reduce((sum, tx) => {
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

  if (accountName === DISKONT_ACCOUNT && new Date().getDate() > 17) {
    return Math.round((base + DISKONT_LATE_MONTH_BONUS) * 100) / 100
  }
  return Math.round(base * 100) / 100
}

// LAYA balance in EUR: amount ÷ exchange rate stored in description field.
// If description is a number → it's the ILS/EUR rate (divide by it).
// If description is text → amount is already in EUR (divide by 1).
export function computeEurBalance(accountName: string, transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    const rate = parseFloat(tx.description) || 1
    const eur = tx.amount / rate
    if (tx.type === 'הכנסה' && tx.from_account === accountName) return sum + eur
    if (tx.type === 'הוצאה' && tx.from_account === accountName) return sum - eur
    if (tx.type === 'העברה' && tx.to_account === accountName) return sum + eur
    if (tx.type === 'העברה' && tx.from_account === accountName) return sum - eur
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
    .map(name => {
      const isEur = EUR_ACCOUNTS.has(name)
      return {
        name,
        group: ACCOUNT_GROUPS[name],
        balance: isEur ? 0 : computeBalance(name, transactions),
        isLoan: LOAN_ACCOUNTS.has(name),
        eurBalance: isEur ? computeEurBalance(name, transactions) : undefined,
      }
    })
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
