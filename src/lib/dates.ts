import { Transaction } from '../types'

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  // Handle various formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY
  const parts = dateStr.split(/[\/\-]/)
  if (parts.length === 3) {
    // If first part is 4 digits, it's YYYY-MM-DD
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }
    // Assume DD/MM/YYYY (Israeli format)
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
  }
  // Try native parse as fallback
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(dateStr: string): string {
  const d = parseDate(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = parseDate(dateStr)
  if (!d) return false
  return d.getFullYear() === year && d.getMonth() === month
}

export function filterByMonth(transactions: Transaction[], year: number, month: number): Transaction[] {
  return transactions.filter(tx => isSameMonth(tx.date, year, month))
}

export function getMonthOptions(transactions: Transaction[]): { label: string; year: number; month: number }[] {
  const seen = new Set<string>()
  const months: { label: string; year: number; month: number }[] = []

  transactions.forEach(tx => {
    const d = parseDate(tx.date)
    if (!d) return
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!seen.has(key)) {
      seen.add(key)
      months.push({
        label: d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
        year: d.getFullYear(),
        month: d.getMonth(),
      })
    }
  })

  return months.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getHebrewMonthName(month: number, year: number): string {
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
}
