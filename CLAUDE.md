# Budget App — CLAUDE.md

## Project Overview

A Hebrew-language personal finance management React app that reads live data from Google Sheets. Built for managing envelope-based budgeting across short-term, long-term, and savings accounts.

## Google Sheets Data Source

**Spreadsheet ID:** `1UvHj1HBeZe_MrT78TeEpQ_oG9bXA-TUL7dbKRla2YDA`

Data is fetched via the public gviz CSV endpoint — **no API key required**:
```
https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet={sheetName}
```

### Key Sheets

| Sheet Name | Purpose |
|---|---|
| `TransactionsList` | Core transaction log |
| `Budget` | Budget allocation config |
| `timedtransactions` | Monthly scheduled transactions |
| `categories` | Category → parent category mapping |

### TransactionsList Schema

| Column | Field | Notes |
|---|---|---|
| 0 | timestamp | Form submission time |
| 1 | date | Transaction date (DD/MM/YYYY) |
| 2 | type | `הכנסה` / `הוצאה` / `העברה` |
| 3 | from_account | Source account |
| 4 | to_account | Destination (transfers only) |
| 5 | category | Expense/income category |
| 6 | amount | Amount in NIS (may include ₪ symbol) |
| 7 | description | Free text notes |

## Account Groups

```
short  (טווח קצר — עו"ש envelopes):
  דיסקונט, קניות, קניות זעתר, טיפוח, בילויים, בלתמים, LAYA, ספורט

long   (טווח ארוך — money market fund envelopes):
  חיסכון לחופשה, בריאות אישית, בריאות זעתר, חשבונות, אירועים

savings (חסכונות):
  חשבון מסחר, גמל להשקעה, קרן חירום, הלוואה דיסקונט,
  קרן פנסיה, קרן השתלמות, הלוואה אמא
```

## Balance Calculation Formula

```
balance(account) =
  + Σ income transactions where from_account = account
  + Σ transfer transactions where to_account = account
  - Σ expense transactions where from_account = account
  - Σ transfer transactions where from_account = account
```

Implemented in `src/lib/balances.ts`.

## Tech Stack

- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **React Router v6** (routing)
- **TanStack Query v5** (data fetching + caching, 60s refetch interval)
- **Recharts** (charts)
- **PapaParse** (CSV parsing)
- **clsx** (conditional classnames)

## Project Structure

```
src/
  api/sheets.ts        — gviz fetch functions (fetchTransactions, fetchCategories, etc.)
  hooks/               — React Query hooks wrapping API calls
  lib/
    balances.ts        — computeBalance(), buildAccounts(), ACCOUNT_GROUPS
    dates.ts           — parseDate(), formatDate(), formatCurrency(), filterByMonth()
  components/
    layout/            — Sidebar, Layout (Outlet wrapper)
    ui/                — Badge, Spinner, ErrorScreen
    charts/            — IncomeExpenseBar, CategoryPie
    AccountCard.tsx    — Clickable card + AccountGroupSection
  pages/
    Dashboard.tsx      — Account grid + charts
    Transactions.tsx   — Filterable/sortable transaction table
    AccountDetail.tsx  — Single account drill-down
    Budget.tsx         — Allocation table + deposit tables
    Scheduled.tsx      — Monthly scheduled transactions
    Categories.tsx     — Category management view
  types/index.ts       — All TypeScript interfaces
```

## Running Locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Conventions

- All UI is RTL Hebrew (`dir="rtl"` on root)
- Currency formatted via `Intl.NumberFormat` in ILS locale
- Date format: DD/MM/YYYY (Israeli)
- Transaction entry is done externally via Taly form → do NOT modify that flow
- Budget allocation config in `src/pages/Budget.tsx` (`ALLOCATIONS` constant) reflects the Google Sheets Budget tab and should be updated to match when the budget changes
