import { useState } from 'react'

interface ShoppingMatch { name: string; is_checked: boolean }
interface InventoryMatch { name: string; quantity: number }

interface Props {
  name: string
  shoppingMatches: ShoppingMatch[]
  inventoryMatches: InventoryMatch[]
  onAddToList: () => Promise<void>
}

export function IngredientRow({ name, shoppingMatches, inventoryMatches, onAddToList }: Props) {
  const [adding, setAdding] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const hasUnchecked = shoppingMatches.some(m => !m.is_checked)
  const hasChecked   = shoppingMatches.some(m => m.is_checked)
  const hasInventory = inventoryMatches.length > 0
  const hasAnyMatch  = shoppingMatches.length > 0 || hasInventory

  async function handleAdd() {
    setAdding(true)
    try { await onAddToList() } finally { setAdding(false) }
  }

  return (
    <li className="flex items-center gap-2 text-sm text-gray-700 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
      <span className="flex-1">{name}</span>

      <div className="flex items-center gap-2 shrink-0">
        {/* Always-visible match indicator dots */}
        {hasAnyMatch && (
          <div
            className="relative flex items-center gap-1"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            {hasUnchecked && (
              <span className="w-2 h-2 rounded-full bg-green-400 cursor-default" />
            )}
            {hasChecked && !hasUnchecked && (
              <span className="w-2 h-2 rounded-full bg-gray-300 cursor-default" />
            )}
            {hasInventory && (
              <span className="w-2 h-2 rounded-full bg-blue-400 cursor-default" />
            )}

            {/* Tooltip */}
            {tooltipVisible && (
              <div className="absolute right-0 bottom-5 z-20 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-xs space-y-2.5">
                {shoppingMatches.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      Shopping list
                    </p>
                    <div className="space-y-1">
                      {shoppingMatches.map((m, i) => (
                        <p key={i} className={m.is_checked ? 'text-gray-400 line-through' : 'text-gray-700'}>
                          {m.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {inventoryMatches.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      Inventory
                    </p>
                    <div className="space-y-1">
                      {inventoryMatches.map((m, i) => (
                        <p key={i} className="text-gray-700">
                          {m.name}
                          <span className="text-gray-400 ml-1">· {m.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add to list button — visible on row hover */}
        <button
          onClick={handleAdd}
          disabled={adding}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {adding ? '…' : '+ List'}
        </button>
      </div>
    </li>
  )
}
