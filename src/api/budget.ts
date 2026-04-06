import { fetchBudgetRaw } from './sheets'

// ── Allocation section (rows 2-16) ────────────────────────────────────────────
export interface BudgetItem {
  name: string
  amount: number
}

export interface BudgetCategory {
  name: string       // e.g. "מחייה 50%"
  allocated: number  // from row 3
  items: BudgetItem[]
  actualFromSheet: number  // "סכום בפועל" from row 14
}

// ── Deposits / fixed ops section (rows 17-31) ─────────────────────────────────
export interface DepositRow {
  account: string
  units: number       // >0 = long-term fund; 0 = direct ILS
  amount: number      // final ILS amount (col 4)
  isLongTerm: boolean
}

export interface FixedOp {
  name: string
  amount: number
}

// ── Temporary installments (rows 32-end) ─────────────────────────────────────
export interface TempOp {
  type: string
  amount: number
  description: string
}

export interface ParsedBudget {
  salary: number
  unitPrice: number
  fundBalance: number   // raw unit count in the fund (col 4 row 1)
  // Allocation table (scenario 1 — left side of sheet)
  categories: BudgetCategory[]
  // Deposit plan
  deposits: DepositRow[]
  // Fixed monthly ops
  fixedOps: FixedOp[]
  // Temporary installments
  tempOps: TempOp[]
}

function parseAmt(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[₪,\s]/g, '').replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}

export function parseBudget(rows: string[][]): ParsedBudget {
  if (rows.length < 5) {
    return { salary: 0, unitPrice: 1, fundBalance: 0, categories: [], deposits: [], fixedOps: [], tempOps: [] }
  }

  // ── Row 1: key parameters ───────────────────────────────────────────────────
  // col0=month, col2=salary, col4=fund units, col6=unit price
  const r1 = rows[1] ?? []
  const salary      = parseAmt(r1[2] ?? '')
  const fundBalance = parseFloat((r1[4] ?? '').replace(/,/g, '')) || 0
  const unitPrice   = parseAmt(r1[6] ?? '')

  // ── Rows 2-16: allocation table (scenario 1 = left side, cols 0-7) ──────────
  //
  // Column layout for scenario 1:
  //   col 0-1 = מחייה  (name, amount)
  //   col 2-3 = קרן/השקעות (col2 often empty, col3 = amount)
  //   col 4-5 = ביטחון (name, amount)
  //   col 6-7 = הנאות  (name, amount)
  //
  // Row 2:  category names  (col0, col4, col6 — col2 empty)
  // Row 3:  "הקצאה" + allocated amounts (col1, col3, col5, col7)
  // Row 5-12: line items per category
  // Row 14: "סכום בפועל" actuals (col1, col3, col5, col7)

  const r2 = rows[2] ?? []
  const r3 = rows[3] ?? []

  // Derive the 4 category names
  // The investments column (col 2-3) has no label in row 2 — use row0 col4 = "קרן"
  const catNames = [
    (r2[0] ?? '').trim() || 'מחייה',
    (rows[0]?.[4] ?? '').trim() || 'קרן',   // "קרן" from header row
    (r2[4] ?? '').trim() || 'ביטחון',
    (r2[6] ?? '').trim() || 'הנאות',
  ]

  const catAllocated = [
    parseAmt(r3[1] ?? ''),  // מחייה
    parseAmt(r3[3] ?? ''),  // קרן
    parseAmt(r3[5] ?? ''),  // ביטחון
    parseAmt(r3[7] ?? ''),  // הנאות
  ]

  const catItems: BudgetItem[][] = [[], [], [], []]

  // Item rows 5..12
  for (let i = 5; i <= 12 && i < rows.length; i++) {
    const row = rows[i]
    // מחייה (col 0-1)
    const n0 = (row[0] ?? '').trim()
    const a1 = parseAmt(row[1] ?? '')
    if (n0 && a1) catItems[0].push({ name: n0, amount: a1 })

    // קרן (col 2-3) — name may be empty
    const a3 = parseAmt(row[3] ?? '')
    if (a3) catItems[1].push({ name: (row[2] ?? '').trim() || '—', amount: a3 })

    // ביטחון (col 4-5)
    const n4 = (row[4] ?? '').trim()
    const a5 = parseAmt(row[5] ?? '')
    if (n4 && a5) catItems[2].push({ name: n4, amount: a5 })

    // הנאות (col 6-7)
    const n6 = (row[6] ?? '').trim()
    const a7 = parseAmt(row[7] ?? '')
    if (n6 && a7) catItems[3].push({ name: n6, amount: a7 })
  }

  // Actuals from row 14 ("סכום בפועל")
  const r14 = rows[14] ?? []
  const catActuals = [
    parseAmt(r14[1] ?? ''),
    parseAmt(r14[3] ?? ''),
    parseAmt(r14[5] ?? ''),
    parseAmt(r14[7] ?? ''),
  ]

  const categories: BudgetCategory[] = catNames.map((name, i) => ({
    name,
    allocated: catAllocated[i],
    items: catItems[i],
    actualFromSheet: catActuals[i],
  }))

  // ── Rows 17+: deposits, fixed ops, temp ops ───────────────────────────────
  const deposits: DepositRow[] = []
  const fixedOps: FixedOp[]   = []
  const tempOps: TempOp[]     = []
  let fundUnitsTotal = 0

  type Section = 'none' | 'deposits' | 'installments'
  let section: Section = 'none'

  for (let i = 17; i < rows.length; i++) {
    const row  = rows[i]
    const col0 = (row[0] ?? '').trim()

    if (col0 === 'הפקדות') { section = 'deposits'; continue }

    if (col0 === 'מעטפה') {
      // Header row for deposit table — col6/col7 = first fixed op (שכר דירה)
      const opName = (row[6] ?? '').trim()
      const opAmt  = parseAmt(row[7] ?? '')
      if (opName && opAmt) fixedOps.push({ name: opName, amount: opAmt })
      continue
    }

    if (col0 === 'יחידות לקנייה') {
      fundUnitsTotal = parseFloat((row[1] ?? '').replace(/,/g, '')) || 0
      void fundUnitsTotal  // used for reference; not needed in output currently
      continue
    }

    if (col0 === 'פעולות זמניות') { section = 'installments'; continue }
    if (col0 === 'סוג')            { continue } // header row

    // Skip summary rows
    if (['סיכום', 'סכום בפועל', 'הפרש בסכום', 'אחוז בפועל', 'הוצאות', 'הקצאה'].includes(col0)) continue

    if (section === 'deposits' && col0) {
      const units  = parseFloat((row[1] ?? '').replace(/,/g, '')) || 0
      const amount = parseAmt(row[4] ?? '')  // col 4 = final rounded amount
      if (amount > 0) {
        deposits.push({ account: col0, units, amount, isLongTerm: units > 0 })
      }
      // Co-located fixed op in same row (col 6-7)
      const opName = (row[6] ?? '').trim()
      const opAmt  = parseAmt(row[7] ?? '')
      if (opName && opAmt) fixedOps.push({ name: opName, amount: opAmt })
    }

    if (section === 'installments' && ['הוצאה', 'הכנסה', 'העברה'].includes(col0)) {
      const amount      = parseAmt(row[3] ?? '')
      const description = (row[4] ?? '').trim()
      if (amount !== 0) tempOps.push({ type: col0, amount, description })
    }
  }

  return { salary, unitPrice, fundBalance, categories, deposits, fixedOps, tempOps }
}

export async function fetchParsedBudget(): Promise<ParsedBudget> {
  const rows = await fetchBudgetRaw()
  return parseBudget(rows)
}
