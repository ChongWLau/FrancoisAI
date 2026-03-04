import { useInventory } from '@/hooks/useInventory'
import { InventoryItemRow } from '@/components/inventory/InventoryItemRow'
import { AddItemInput } from '@/components/shopping/AddItemInput'

const SECTIONS: { key: string; label: string; emoji: string }[] = [
  { key: 'unsorted', label: 'Unsorted', emoji: '📌' },
  { key: 'fridge',   label: 'Fridge',   emoji: '🥶' },
  { key: 'freezer',  label: 'Freezer',  emoji: '❄️' },
  { key: 'pantry',   label: 'Pantry',   emoji: '🥫' },
  { key: 'other',    label: 'Other',    emoji: '📦' },
]

export function InventoryPage() {
  const { grouped, loading, addItem, getSuggestions, deleteItem, renameItem, setLocation } = useInventory()

  const totalItems = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-display font-semibold text-gray-900">Inventory</h1>
        {totalItems > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">{totalItems} items tracked</p>
        )}
      </div>

      {/* Add item input */}
      <div className="mb-6">
        <AddItemInput onAdd={addItem} getSuggestions={getSuggestions} stapleNames={[]} />
      </div>

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="text-center py-14 text-gray-400">
          <p className="text-5xl mb-4">🗄️</p>
          <p className="text-sm">Nothing here yet.</p>
          <p className="text-xs mt-2 text-gray-300 max-w-xs mx-auto">
            Add items above, or check them off the shopping list to add automatically.
          </p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {SECTIONS.map(section => {
          const items = grouped[section.key]
          if (!items || items.length === 0) return null

          return (
            <div key={section.key}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">{section.emoji}</span>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {section.label}
                </h2>
                <span className="text-xs text-gray-400">· {items.length}</span>
              </div>

              <ul className="space-y-1.5">
                {items.map(item => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    onDelete={() => deleteItem(item.id)}
                    onRename={name => renameItem(item.id, name)}
                    onSetLocation={loc => setLocation(item.id, loc)}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
