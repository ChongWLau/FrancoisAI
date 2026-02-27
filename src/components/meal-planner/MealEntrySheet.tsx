import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDayLong } from '@/lib/dates'
import type { MealType } from '@/types/supabase'
import type { MealEntryWithRecipe } from '@/hooks/useMealEntries'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

interface RecipeResult {
  id: string
  title: string
  image_url: string | null
}

export interface SelectedSlot {
  date: string
  mealType: MealType
  existingEntry?: MealEntryWithRecipe
}

interface Props {
  slot: SelectedSlot | null
  onClose: () => void
  onSave: (recipeId: string | null, customText: string | null) => Promise<void>
  onDelete: () => Promise<void>
}

export function MealEntrySheet({ slot, onClose, onSave, onDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RecipeResult[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeResult | null>(null)
  const [customText, setCustomText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Populate fields from existing entry when sheet opens
  useEffect(() => {
    if (!slot) return
    const existing = slot.existingEntry
    if (existing?.recipes) {
      setSelectedRecipe({
        id: existing.recipe_id!,
        title: existing.recipes.title,
        image_url: existing.recipes.image_url,
      })
      setCustomText('')
    } else if (existing?.custom_meal_text) {
      setSelectedRecipe(null)
      setCustomText(existing.custom_meal_text)
    } else {
      setSelectedRecipe(null)
      setCustomText('')
    }
    setSearchQuery('')
    setSearchResults([])
    // Auto-focus search on open
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [slot])

  // Debounced recipe search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
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

  async function handleSave() {
    setSaving(true)
    try {
      if (selectedRecipe) {
        await onSave(selectedRecipe.id, null)
      } else if (customText.trim()) {
        await onSave(null, customText.trim())
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  function selectRecipe(recipe: RecipeResult) {
    setSelectedRecipe(recipe)
    setSearchQuery('')
    setSearchResults([])
    setCustomText('')
  }

  const canSave = selectedRecipe !== null || customText.trim() !== ''

  if (!slot) return null

  const slotDate = new Date(slot.date + 'T00:00:00')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {MEAL_LABELS[slot.mealType]}
            </p>
            <p className="text-base font-semibold text-gray-900">{formatDayLong(slotDate)}</p>
          </div>
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
          {/* Selected recipe chip */}
          {selectedRecipe && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              {selectedRecipe.image_url && (
                <img
                  src={selectedRecipe.image_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              )}
              <span className="flex-1 text-sm font-medium text-blue-900 truncate">
                {selectedRecipe.title}
              </span>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-blue-400 hover:text-blue-700 transition-colors text-sm font-medium shrink-0"
              >
                Change
              </button>
            </div>
          )}

          {/* Recipe search (shown when no recipe selected) */}
          {!selectedRecipe && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Search your recipes
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Type to search…"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {searchResults.map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => selectRecipe(recipe)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-base shrink-0">
                          🍽
                        </div>
                      )}
                      <span className="text-sm text-gray-800">{recipe.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.trim() && searchResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No recipes found</p>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">or enter a custom meal</span>
                </div>
              </div>

              {/* Custom text */}
              <input
                type="text"
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canSave && handleSave()}
                placeholder="e.g. Leftovers, Takeaway, Fasting…"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          {slot.existingEntry && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="ml-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}
