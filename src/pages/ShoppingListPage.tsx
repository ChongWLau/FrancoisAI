import { useEffect, useRef, useState } from 'react'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useStapleItems } from '@/hooks/useStapleItems'
import { AddItemInput } from '@/components/shopping/AddItemInput'
import { ManageStaplesSheet } from '@/components/shopping/ManageStaplesSheet'
import { getWeekStart, toISODate } from '@/lib/dates'

export function ShoppingListPage() {
  const {
    unchecked,
    checked,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    addStaplesToList,
    getSuggestions,
  } = useShoppingList()
  const { staples, loading: staplesLoading, addStaple, deleteStaple } = useStapleItems()

  const [showStaplesSheet, setShowStaplesSheet] = useState(false)
  const [restocking, setRestocking] = useState(false)
  const autoRestockDoneRef = useRef(false)

  // Auto-restock staples once per week on first page load
  useEffect(() => {
    if (loading || staplesLoading || autoRestockDoneRef.current) return
    autoRestockDoneRef.current = true

    const weekKey = toISODate(getWeekStart(new Date()))
    if (localStorage.getItem('lastStapleWeek') === weekKey) return

    // New week — add any staples not already on the list
    if (staples.length > 0) {
      addStaplesToList(staples.map(s => s.name)).then(() => {
        localStorage.setItem('lastStapleWeek', weekKey)
      })
    } else {
      localStorage.setItem('lastStapleWeek', weekKey)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, staplesLoading])

  async function handleRestock() {
    if (staples.length === 0) return
    setRestocking(true)
    try {
      await addStaplesToList(staples.map(s => s.name))
      localStorage.setItem('lastStapleWeek', toISODate(getWeekStart(new Date())))
    } finally {
      setRestocking(false)
    }
  }

  const totalItems = unchecked.length + checked.length

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Shopping List</h1>
          {totalItems > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {unchecked.length} remaining · {checked.length} in cart
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {staples.length > 0 && (
            <button
              onClick={handleRestock}
              disabled={restocking}
              className="px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {restocking ? 'Adding…' : '↺ Restock'}
            </button>
          )}
          <button
            onClick={() => setShowStaplesSheet(true)}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Staples
          </button>
        </div>
      </div>

      {/* Add item input */}
      <div className="mb-6">
        <AddItemInput
          onAdd={addItem}
          getSuggestions={getSuggestions}
          stapleNames={staples.map(s => s.name)}
        />
      </div>

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="text-center py-14 text-gray-400">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-sm">Your list is empty.</p>
          {staples.length > 0 && (
            <button
              onClick={handleRestock}
              className="mt-3 text-sm text-blue-600 font-medium hover:underline"
            >
              Add staple items
            </button>
          )}
        </div>
      )}

      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <ul className="space-y-1.5 mb-5">
          {unchecked.map(item => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl group"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-blue-500 shrink-0 transition-colors"
                aria-label={`Mark ${item.name} as done`}
              />
              <span className="flex-1 text-sm text-gray-800">{item.name}</span>
              <button
                onClick={() => deleteItem(item.id)}
                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xl leading-none shrink-0"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              In cart · {checked.length}
            </p>
            <button
              onClick={clearChecked}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-1.5">
            {checked.map(item => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl group"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-5 h-5 rounded-full border-2 border-green-400 bg-green-400 flex items-center justify-center shrink-0"
                  aria-label={`Unmark ${item.name}`}
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xl leading-none shrink-0"
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Manage staples sheet */}
      {showStaplesSheet && (
        <ManageStaplesSheet
          staples={staples}
          onAdd={addStaple}
          onDelete={deleteStaple}
          onClose={() => setShowStaplesSheet(false)}
        />
      )}
    </div>
  )
}
