import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content — padding-bottom on mobile to clear bottom nav */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
