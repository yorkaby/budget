import Papa from 'papaparse'
import { Transaction, Category, TimedTransaction } from '../types'

const SHEET_ID = '1UvHj1HBeZe_MrT78TeEpQ_oG9bXA-TUL7dbKRla2YDA'

function sheetUrl(sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
}

async function fetchCsv(sheetName: string): Promise<string[][]> {
  const res = await fetch(sheetUrl(sheetName))
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${sheetName}`)
  const text = await res.text()
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
  return result.data
}

function parseAmount(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[₪,\s]/g, '').replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const rows = await fetchCsv('TransactionsList')
  if (rows.length < 2) return []

  // Skip header row
  return rows.slice(1).map((row) => ({
    timestamp: row[0] ?? '',
    date: row[1] ?? '',
    type: (row[2] ?? '') as Transaction['type'],
    from_account: row[3] ?? '',
    to_account: row[4] ?? '',
    category: row[5] ?? '',
    amount: parseAmount(row[6] ?? ''),
    description: row[7] ?? '',
    monthTag: parseInt(row[9] ?? '') || undefined,
  })).filter(tx => tx.date && tx.type && tx.amount !== 0)
}

export async function fetchCategories(): Promise<Category[]> {
  const rows = await fetchCsv('categories')
  if (rows.length < 2) return []

  return rows.slice(1)
    .filter(row => row[0])
    .map((row) => ({
      name: row[0] ?? '',
      parent: row[1] ?? '',
      type: (row[2] ?? '') as Category['type'],
    }))
}

export async function fetchTimedTransactions(): Promise<TimedTransaction[]> {
  const rows = await fetchCsv('timedtransactions')
  if (rows.length < 2) return []

  return rows.slice(1)
    .filter(row => row[0] && row[4])
    .map((row) => {
      const desc = row[5] ?? ''
      // Parse installment info from description e.g. "תשלום 4/10"
      const installmentMatch = desc.match(/תשלום\s+(\d+)\/(\d+)/)
      const remaining = installmentMatch
        ? parseInt(installmentMatch[2]) - parseInt(installmentMatch[1]) + 1
        : undefined
      const total = installmentMatch ? parseInt(installmentMatch[2]) : undefined

      return {
        type: (row[0] ?? '') as TimedTransaction['type'],
        from_account: row[1] ?? '',
        to_account: row[2] ?? '',
        category: row[3] ?? '',
        amount: parseAmount(row[4] ?? ''),
        description: desc,
        totalPayments: total,
        remainingPayments: remaining,
      }
    })
}

export async function fetchBudgetRaw(): Promise<string[][]> {
  return fetchCsv('Budget')
}
