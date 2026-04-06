import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  List,
  Calculator,
  CalendarClock,
  Tag,
  TrendingUp,
} from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/', label: 'דשבורד', icon: LayoutDashboard },
  { to: '/transactions', label: 'טרנזקציות', icon: List },
  { to: '/budget', label: 'תקציב', icon: Calculator },
  { to: '/scheduled', label: 'פעולות מתוזמנות', icon: CalendarClock },
  { to: '/categories', label: 'קטגוריות', icon: Tag },
]

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <TrendingUp className="w-7 h-7 text-blue-400" />
        <span className="text-lg font-bold tracking-tight">תקציב חכם</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
        נתונים מ-Google Sheets
      </div>
    </aside>
  )
}
