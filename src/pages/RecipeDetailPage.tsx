import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRecipe, saveRecipe, recipeToFormData } from '@/hooks/useRecipes'
import { useCollections } from '@/hooks/useCollections'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useInventory } from '@/hooks/useInventory'
import { supabase } from '@/lib/supabase'
import { RecipeForm, type RecipeFormData } from '@/components/recipes/RecipeForm'
import { IngredientRow } from '@/components/recipes/IngredientRow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const STOP_WORDS = new Set([
  'cup', 'cups', 'tsp', 'tbsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
  'pound', 'pounds', 'ounce', 'ounces', 'gram', 'grams', 'kilogram', 'liter', 'liters',
  'can', 'jar', 'bag', 'bunch', 'pinch', 'handful', 'clove', 'cloves', 'slice', 'slices',
  'large', 'small', 'medium', 'fresh', 'dried', 'frozen', 'whole', 'half',
  'minced', 'diced', 'chopped', 'sliced', 'grated', 'ground', 'crushed', 'peeled',
  'and', 'the', 'for', 'with',
])

function ingredientWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

function fuzzyMatch(ingredientName: string, itemName: string): boolean {
  const a = ingredientWords(ingredientName)
  const b = ingredientWords(itemName)
  if (!a.length || !b.length) return false
  return a.some(aw => b.some(bw => bw.includes(aw) || aw.includes(bw)))
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Ingredient quantity scaling ──────────────────────────────

function parseQtyStr(s: string): number {
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return +mixed[1] + +mixed[2] / +mixed[3]
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) return +frac[1] / +frac[2]
  return parseFloat(s)
}

function parseIngredientQty(name: string): { qty: number; rest: string } | null {
  const m = name.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*/)
  if (!m) return null
  return { qty: parseQtyStr(m[1].trim()), rest: name.slice(m[0].length) }
}

const QTY_FRACS: [number, string][] = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'],
  [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
]

function formatQty(n: number): string {
  if (n <= 0) return ''
  const whole = Math.floor(n)
  const frac = n - whole
  if (frac < 0.04) return String(whole)
  if (frac > 0.96) return String(whole + 1)
  for (const [val, sym] of QTY_FRACS) {
    if (Math.abs(frac - val) < 0.04) return whole > 0 ? `${whole} ${sym}` : sym
  }
  return n.toFixed(1)
}

function scaleIngredient(name: string, factor: number): string {
  if (Math.abs(factor - 1) < 0.001) return name
  const parsed = parseIngredientQty(name)
  if (!parsed) return name
  const scaled = formatQty(parsed.qty * factor)
  return scaled ? `${scaled} ${parsed.rest}` : parsed.rest
}

// ────────────────────────────────────────────────────────────

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { recipe, loading, error, refetch } = useRecipe(id!)
  const { collections } = useCollections()
  const { unchecked, checked, addItem: addToShoppingList } = useShoppingList()
  const { items: inventoryItems } = useInventory()

  const allShoppingItems = useMemo(() => [...unchecked, ...checked], [unchecked, checked])

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [customServings, setCustomServings] = useState<number | null>(null)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)

  async function handleSave(data: RecipeFormData) {
    if (!user) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveRecipe(data, user.id, id!)
      await refetch()
      setEditing(false)
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    setDeleting(true)
    await db.from('recipes').delete().eq('id', id!)
    navigate('/recipes')
  }

  async function addToCollection(collectionId: string) {
    await db.from('recipe_collections').insert({
      recipe_id: id!,
      collection_id: collectionId,
      added_by: user?.id,
    })
    await refetch()
    setShowCollectionPicker(false)
  }

  async function removeFromCollection(collectionId: string) {
    await db.from('recipe_collections')
      .delete()
      .eq('recipe_id', id!)
      .eq('collection_id', collectionId)
    await refetch()
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
  }

  if (error || !recipe) {
    return <div className="text-center text-red-500 py-16 text-sm">{error ?? 'Recipe not found'}</div>
  }

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)
  const displayServings = customServings ?? recipe.servings ?? null
  const ingredientScale = recipe.servings && displayServings ? displayServings / recipe.servings : 1
  const isScaled = customServings !== null && customServings !== recipe.servings

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/recipes')}
          className="text-gray-400 hover:text-gray-900 transition-colors text-lg"
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                onClick={() => { setEditing(true); setCustomServings(null) }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        /* ── Edit mode ── */
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Recipe</h1>
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              {saveError}
            </p>
          )}
          <RecipeForm
            initialData={recipeToFormData(recipe)}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
          />
        </div>
      ) : (
        /* ── View mode ── */
        <article className="space-y-8">
          {recipe.image_url && (
            <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 leading-tight">{recipe.title}</h1>
            {recipe.description && (
              <p className="mt-3 text-gray-600 leading-relaxed">{recipe.description}</p>
            )}
          </div>

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-3 text-sm">
            {recipe.prep_time_minutes && (
              <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 min-w-[80px]">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Prep</span>
                <span className="font-semibold text-gray-800">{formatTime(recipe.prep_time_minutes)}</span>
              </div>
            )}
            {recipe.cook_time_minutes && (
              <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 min-w-[80px]">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Cook</span>
                <span className="font-semibold text-gray-800">{formatTime(recipe.cook_time_minutes)}</span>
              </div>
            )}
            {totalTime > 0 && recipe.prep_time_minutes && recipe.cook_time_minutes && (
              <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 min-w-[80px]">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total</span>
                <span className="font-semibold text-gray-800">{formatTime(totalTime)}</span>
              </div>
            )}

            {/* Interactive servings adjuster */}
            {recipe.servings && (
              <div className={`flex flex-col items-center rounded-xl px-3 py-2 min-w-[80px] border transition-colors ${
                isScaled ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Serves</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCustomServings(s => Math.max(1, (s ?? recipe.servings!) - 1))}
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-amber-200 text-gray-600 hover:text-amber-800 text-xs font-bold flex items-center justify-center transition-colors"
                    aria-label="Decrease servings"
                  >
                    −
                  </button>
                  <span className={`font-semibold w-5 text-center tabular-nums ${isScaled ? 'text-amber-700' : 'text-gray-800'}`}>
                    {displayServings}
                  </span>
                  <button
                    onClick={() => setCustomServings(s => (s ?? recipe.servings!) + 1)}
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-amber-200 text-gray-600 hover:text-amber-800 text-xs font-bold flex items-center justify-center transition-colors"
                    aria-label="Increase servings"
                  >
                    +
                  </button>
                </div>
                {isScaled && (
                  <button
                    onClick={() => setCustomServings(null)}
                    className="mt-0.5 text-[10px] text-amber-500 hover:text-amber-700 transition-colors"
                  >
                    reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-amber-50 text-amber-700 text-sm rounded-full border border-amber-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Collections */}
          <div className="relative">
            <div className="flex flex-wrap gap-2 items-center">
              {(recipe.recipe_collections ?? []).map(rc => (
                <div
                  key={rc.collection_id}
                  className="flex items-center gap-1 px-3 py-1 bg-navy-100 text-navy-700 text-sm rounded-full"
                >
                  <span>{rc.collections.name}</span>
                  <button
                    onClick={() => removeFromCollection(rc.collection_id)}
                    className="ml-0.5 text-navy-400 hover:text-navy-800 leading-none"
                    aria-label={`Remove from ${rc.collections.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowCollectionPicker(p => !p)}
                className="px-3 py-1 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                + Collection
              </button>
            </div>
            {showCollectionPicker && (() => {
              const available = collections.filter(
                c => !(recipe.recipe_collections ?? []).some(rc => rc.collection_id === c.id)
              )
              return (
                <div className="mt-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm max-w-xs">
                  {available.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-2">Added to all collections</p>
                  ) : (
                    available.map(c => (
                      <button
                        key={c.id}
                        onClick={() => addToCollection(c.id)}
                        className="block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        {c.name}
                      </button>
                    ))
                  )}
                </div>
              )
            })()}
          </div>

          {/* Ingredients */}
          {recipe.recipe_ingredients.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
              <ul className="space-y-1.5">
                {recipe.recipe_ingredients.map(ing => {
                  const scaledName = scaleIngredient(ing.name, ingredientScale)
                  return (
                    <IngredientRow
                      key={ing.id}
                      name={scaledName}
                      shoppingMatches={allShoppingItems.filter(item => fuzzyMatch(ing.name, item.name))}
                      inventoryMatches={inventoryItems.filter(item => fuzzyMatch(ing.name, item.name))}
                      onAddToList={() => addToShoppingList(scaledName)}
                    />
                  )
                })}
              </ul>
            </section>
          )}

          {/* Steps */}
          {recipe.recipe_steps.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.recipe_steps.map((step, i) => (
                  <li key={step.id} className="flex gap-4">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-navy-800 text-white text-sm font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed pt-1">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Source link */}
          {recipe.source_url && (
            <div className="pt-4 border-t border-gray-100">
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-600 hover:text-amber-700 hover:underline"
              >
                View original recipe ↗
              </a>
            </div>
          )}
        </article>
      )}
    </div>
  )
}
