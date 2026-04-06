import { fetchBudgetRaw } from './sheets'

export interface DepositRow {
  account: string
  units: number       // >0 = long-term fund units; 0 = direct ILS transfer
  amount: number      // final ILS amount (col 4 in Budget sheet)
  isLongTerm: boolean
}

export interface FixedOp {
  name: string
  amount: number
}

export interface TempOp {
  type: string        // הכנסה / הוצאה
  amount: number
  description: string // e.g. "תשלום 4/10"
}

export interface ParsedBudget {
  salary: number
  fundBalance: number
  unitPrice: number
  fundUnits: number   // total units to buy (from "יחידות לקנייה" row)
  deposits: DepositRow[]
  fixedOps: FixedOp[]
  tempOps: TempOp[]
}

function parseAmt(val: string): number {
  if (!val) return 0
  return parseFloat(val.replace(/[₪,\s]/g, '').replace(/[^0-9.-]/g, '')) || 0
}

export function parseBudget(rows: string[][]): ParsedBudget {
  // Row 0 = column headers, Row 1 = values
  // col2 = salary, col4 = fund balance, col6 = unit price
  const valRow = rows[1] ?? []
  const salary      = parseAmt(valRow[2] ?? '')
  const fundBalance = parseFloat((valRow[4] ?? '').replace(/,/g, '')) || 0
  const unitPrice   = parseAmt(valRow[6] ?? '')

  const deposits: DepositRow[] = []
  const fixedOps: FixedOp[]   = []
  const tempOps: TempOp[]     = []

  let fundUnits = 0

  type Section = 'none' | 'deposits' | 'installments'
  let section: Section = 'none'
  let skipNextRow = false // skip column-header rows

  for (let i = 2; i < rows.length; i++) {
    const row  = rows[i]
    const col0 = (row[0] ?? '').trim()

    if (skipNextRow) {
      skipNextRow = false
      continue
    }

    // ── Section transitions ──────────────────────────────────────────
    if (col0 === 'הפקדות') {
      section = 'deposits'
      // col6 = "פעולות קבועות" (just a sub-header, no amount — skip)
      continue
    }

    if (col0 === 'מעטפה') {
      // Deposit column-header row; col6/col7 carry first fixed op
      const opName = (row[6] ?? '').trim()
      const opAmt  = parseAmt(row[7] ?? '')
      if (opName && opAmt) fixedOps.push({ name: opName, amount: opAmt })
      continue
    }

    if (col0 === 'יחידות לקנייה') {
      fundUnits = parseFloat((row[1] ?? '').replace(/,/g, '')) || 0
      continue
    }

    if (col0 === 'פעולות זמניות') {
      section = 'installments'
      continue
    }

    if (col0 === 'סוג') {
      // Skip the column-header row for installments
      continue
    }

    // Skip summary rows that appear inside the deposits block
    if (['סיכום', 'סכום בפועל', 'הפרש בסכום', 'אחוז בפועל', 'הוצאות', 'הקצאה'].includes(col0)) {
      continue
    }

    // ── Section content ──────────────────────────────────────────────
    if (section === 'deposits' && col0) {
      const units  = parseFloat((row[1] ?? '').replace(/,/g, '')) || 0
      const amount = parseAmt(row[4] ?? '') // final/rounded amount column
      if (amount > 0) {
        deposits.push({ account: col0, units, amount, isLongTerm: units > 0 })
      }
      // Co-located fixed op on the same row
      const opName = (row[6] ?? '').trim()
      const opAmt  = parseAmt(row[7] ?? '')
      if (opName && opAmt) fixedOps.push({ name: opName, amount: opAmt })
    }

    if (section === 'installments' && (col0 === 'הוצאה' || col0 === 'הכנסה' || col0 === 'העברה')) {
      const amount      = parseAmt(row[3] ?? '')
      const description = (row[4] ?? '').trim()
      if (amount !== 0) {
        tempOps.push({ type: col0, amount, description })
      }
    }
  }

  return { salary, fundBalance, unitPrice, fundUnits, deposits, fixedOps, tempOps }
}

export async function fetchParsedBudget(): Promise<ParsedBudget> {
  const rows = await fetchBudgetRaw()
  return parseBudget(rows)
}
