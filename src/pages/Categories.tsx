import { useState, useMemo } from 'react'
import { useCategories } from '../hooks/useCategories'
import { LoadingScreen, ErrorScreen } from '../components/ui/Spinner'

export function Categories() {
  const { data: categories = [], isLoading, error } = useCategories()
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!filter) return categories
    const q = filter.toLowerCase()
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.parent.toLowerCase().includes(q)
    )
  }, [categories, filter])

  // Group by parent
  const byParent = useMemo(() => {
    const map: Record<string, typeof categories> = {}
    filtered.forEach(c => {
      const p = c.parent || 'ללא קטגוריית אב'
      if (!map[p]) map[p] = []
      map[p].push(c)
    })
    return map
  }, [filtered])

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={(error as Error).message} />

  const typeColor: Record<string, string> = {
    'הכנסה': 'text-green-600 bg-green-50',
    'הוצאה': 'text-red-600 bg-red-50',
  }

  return (
    <div className="p-6 max-w-screen-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">קטגוריות</h1>
        <input
          type="text"
          placeholder="חיפוש קטגוריה..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-52"
        />
      </div>

      <div className="space-y-4">
        {Object.entries(byParent).map(([parent, cats]) => (
          <div key={parent} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">{parent}</h2>
              <span className="text-xs text-gray-400">{cats.length} קטגוריות</span>
            </div>
            <div className="divide-y divide-gray-50">
              {cats.map((cat, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <span className="text-gray-800">{cat.name}</span>
                  {cat.type && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[cat.type] ?? 'text-gray-500 bg-gray-100'}`}>
                      {cat.type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(byParent).length === 0 && (
          <div className="text-center py-10 text-gray-400">אין קטגוריות</div>
        )}
      </div>
    </div>
  )
}
