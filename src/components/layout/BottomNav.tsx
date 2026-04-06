import { NavLink } from 'react-router-dom'
import { LayoutDashboard, List, Calculator, CalendarClock, Tag } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/', label: 'דשבורד', icon: LayoutDashboard },
  { to: '/transactions', label: 'טרנזקציות', icon: List },
  { to: '/budget', label: 'תקציב', icon: Calculator },
  { to: '/scheduled', label: 'מתוזמן', icon: CalendarClock },
  { to: '/categories', label: 'קטגוריות', icon: Tag },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 bg-gray-900 border-t border-gray-700 flex md:hidden">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            clsx(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors',
              isActive ? 'text-blue-400' : 'text-gray-400'
            )
          }
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
