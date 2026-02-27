import type { InventoryEntry } from '@/hooks/useInventory'
import type { StorageLocation } from '@/types/supabase'

const LOCATION_OPTIONS: { value: StorageLocation | ''; label: string }[] = [
  { value: '',        label: 'Unsorted' },
  { value: 'fridge',  label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'pantry',  label: 'Pantry' },
  { value: 'other',   label: 'Other' },
]

interface Props {
  item: InventoryEntry
  inShoppingList: boolean
  onIncrement: () => void
  onDecrement: () => void
  onDelete: () => void
  onSetLocation: (location: StorageLocation | null) => void
  onRestock: () => void
}

export function InventoryItemRow({
  item,
  inShoppingList,
  onIncrement,
  onDecrement,
  onDelete,
  onSetLocation,
  onRestock,
}: Props) {
  const isEmpty = item.quantity === 0

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border group transition-colors ${
        isEmpty ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'
      }`}
    >
      {/* Location dropdown */}
      <select
        value={item.location ?? ''}
        onChange={e => onSetLocation((e.target.value as StorageLocation) || null)}
        className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 shrink-0 focus:outline-none focus:ring-1 focus:ring-amber-300"
      >
        {LOCATION_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Name */}
      <span className={`flex-1 text-sm min-w-0 truncate ${isEmpty ? 'text-gray-400' : 'text-gray-800'}`}>
        {item.name}
      </span>

      {/* Restock button — left of stepper, only when empty */}
      {isEmpty && (
        <button
          onClick={onRestock}
          disabled={inShoppingList}
          className="text-xs font-semibold border rounded-lg px-3 py-1.5 shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
            text-amber-600 border-amber-300 hover:bg-amber-50 disabled:hover:bg-transparent"
        >
          {inShoppingList ? 'Added' : '+ Restock'}
        </button>
      )}

      {/* Quantity stepper — always visible; − disabled at 0 */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDecrement}
          disabled={isEmpty}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-semibold text-gray-800 tabular-nums">
          {item.quantity}
        </span>
        <button
          onClick={onIncrement}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
        >
          +
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xl leading-none shrink-0"
        aria-label={`Remove ${item.name}`}
      >
        ×
      </button>
    </div>
  )
}
