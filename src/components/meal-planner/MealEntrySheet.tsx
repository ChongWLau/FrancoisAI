import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDayLong } from '@/lib/dates'
import type { MealEntry, MealRecipe } from '@/hooks/useMealEntries'

interface RecipeResult {
  id: string
  title: string
  image_url: string | null
}

interface Props {
  date: string | null
  meals: MealEntry[]
  onClose: () => void
  onAddMeal: (name: string) => Promise<void>
  onDeleteMeal: (id: string) => Promise<void>
  onAddRecipe: (mealEntryId: string, recipeId: string) => Promise<void>
  onRemoveRecipe: (mealEntryRecipeId: string) => Promise<void>
  onReorderMeal: (id: string, direction: 'up' | 'down') => Promise<void>
}

export function MealEntrySheet({
  date,
  meals,
  onClose,
  onAddMeal,
  onDeleteMeal,
  onAddRecipe,
  onRemoveRecipe,
  onReorderMeal,
}: Props) {
  const [newMealName, setNewMealName] = useState('')
  const [addingMeal, setAddingMeal] = useState(false)

  // Which meal is showing the recipe search UI
  const [addingRecipeTo, setAddingRecipeTo] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RecipeResult[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const newMealInputRef = useRef<HTMLInputElement>(null)

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (!date) return
    setNewMealName('')
    setAddingRecipeTo(null)
    setSearchQuery('')
    setSearchResults([])
    setTimeout(() => newMealInputRef.current?.focus(), 100)
  }, [date])

  // Debounced recipe search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data } = await db
        .from('recipes')
        .select('id, title, image_url')
        .ilike('title', `%${searchQuery.trim()}%`)
        .limit(6)
      setSearchResults((data ?? []) as RecipeResult[])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function openRecipeSearch(mealId: string) {
    setAddingRecipeTo(mealId)
    setSearchQuery('')
    setSearchResults([])
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  function closeRecipeSearch() {
    setAddingRecipeTo(null)
    setSearchQuery('')
    setSearchResults([])
  }

  async function handleSelectRecipe(recipe: RecipeResult) {
    if (!addingRecipeTo) return
    await onAddRecipe(addingRecipeTo, recipe.id)
    closeRecipeSearch()
  }

  async function handleAddMeal(name?: string) {
    const mealName = name ?? newMealName.trim()
    if (!mealName) return
    setAddingMeal(true)
    try {
      await onAddMeal(mealName)
      if (!name) setNewMealName('')
    } finally {
      setAddingMeal(false)
    }
  }

  if (!date) return null

  const dayDate = new Date(date + 'T00:00:00')

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <p className="text-base font-semibold text-gray-900">{formatDayLong(dayDate)}</p>
          <button
            onClick={onClose}
            className="p-2 -mr-1 text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Existing meals */}
          {meals.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No meals planned — add one below.</p>
          )}

          {meals.map((meal, i) => (
            <div key={meal.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Meal header */}
              <div className="flex items-center gap-1 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="flex-1 text-sm font-semibold text-gray-800">{meal.name}</span>
                <button
                  onClick={() => onReorderMeal(meal.id, 'up')}
                  disabled={i === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move up"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M8 3.5 3 9h10z"/></svg>
                </button>
                <button
                  onClick={() => onReorderMeal(meal.id, 'down')}
                  disabled={i === meals.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move down"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M8 12.5 3 7h10z"/></svg>
                </button>
                <button
                  onClick={() => onDeleteMeal(meal.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none ml-1"
                  aria-label={`Delete ${meal.name}`}
                >
                  ×
                </button>
              </div>

              {/* Recipe list */}
              <div className="px-4 py-3 space-y-2">
                {meal.recipes.map((recipe: MealRecipe) => (
                  <RecipeChip
                    key={recipe.id}
                    recipe={recipe}
                    onRemove={() => onRemoveRecipe(recipe.id)}
                  />
                ))}

                {/* Inline recipe search for this meal */}
                {addingRecipeTo === meal.id ? (
                  <div className="mt-2 space-y-2">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search recipes…"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {searchResults.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                        {searchResults.map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleSelectRecipe(r)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            {r.image_url ? (
                              <img src={r.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">🍽</div>
                            )}
                            <span className="text-sm text-gray-800">{r.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.trim() && searchResults.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-1">No recipes found</p>
                    )}
                    <button
                      onClick={closeRecipeSearch}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openRecipeSearch(meal.id)}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors mt-1"
                  >
                    + Add recipe
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* New meal form */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">New meal</p>
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Prep'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleAddMeal(suggestion)}
                  disabled={addingMeal}
                  className="px-2.5 py-1 text-xs font-medium rounded-full border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={newMealInputRef}
                type="text"
                value={newMealName}
                onChange={e => setNewMealName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newMealName.trim() && handleAddMeal()}
                placeholder="Custom name…"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => handleAddMeal()}
                disabled={!newMealName.trim() || addingMeal}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {addingMeal ? '…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function RecipeChip({ recipe, onRemove }: { recipe: MealRecipe; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      {recipe.image_url && (
        <img src={recipe.image_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
      )}
      <span className="flex-1 text-sm text-amber-900 truncate">{recipe.title}</span>
      <button
        onClick={onRemove}
        className="text-amber-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0"
        aria-label={`Remove ${recipe.title}`}
      >
        ×
      </button>
    </div>
  )
}
