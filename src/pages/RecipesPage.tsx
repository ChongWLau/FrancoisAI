import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRecipes } from '@/hooks/useRecipes'
import { useCollections } from '@/hooks/useCollections'
import { RecipeCard } from '@/components/recipes/RecipeCard'

type FilterMode = 'mine' | 'all' | string // string = collection id

export function RecipesPage() {
  const { user } = useAuth()
  const { recipes, loading, error } = useRecipes()
  const { collections, createCollection } = useCollections()

  const [query, setQuery] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('mine')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false)
  const newCollectionInputRef = useRef<HTMLInputElement>(null)

  // Pool of recipes for the active filter (before text search)
  const basePool = useMemo(() => {
    if (filterMode === 'mine') return recipes.filter(r => r.created_by === user?.id)
    if (filterMode === 'all') return recipes
    return recipes.filter(r =>
      (r.recipe_collections ?? []).some(rc => rc.collection_id === filterMode)
    )
  }, [recipes, filterMode, user])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return basePool
    return basePool.filter(recipe =>
      recipe.title.toLowerCase().includes(q) ||
      recipe.recipe_ingredients.some(ing => ing.name.toLowerCase().includes(q))
    )
  }, [basePool, query])

  const isSearching = query.trim().length > 0

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!newCollectionName.trim() || !user) return
    const newCol = await createCollection(newCollectionName.trim(), user.id)
    setNewCollectionName('')
    setShowNewCollectionInput(false)
    setFilterMode(newCol.id)
  }

  const hasContent = !loading && !error

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-gray-900">Recipes</h1>
        <Link
          to="/recipes/new"
          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          Add Recipe
        </Link>
      </div>

      {/* Search bar */}
      {hasContent && recipes.length > 0 && (
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or ingredient…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoComplete="off"
          />
          {isSearching && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Filter chips */}
      {hasContent && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* My Recipes / All chips */}
          {(['mine', 'all'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filterMode === mode
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {mode === 'mine' ? 'My Recipes' : 'All'}
            </button>
          ))}

          {/* Collection chips */}
          {collections.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterMode(c.id)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filterMode === c.id
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {c.name}
            </button>
          ))}

          {/* New collection */}
          {showNewCollectionInput ? (
            <form onSubmit={handleCreateCollection} className="flex items-center gap-1">
              <input
                ref={newCollectionInputRef}
                autoFocus
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="px-3 py-1.5 text-sm border border-amber-400 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 w-40"
                onBlur={() => { if (!newCollectionName.trim()) setShowNewCollectionInput(false) }}
              />
              <button
                type="submit"
                disabled={!newCollectionName.trim()}
                className="px-2 py-1 text-sm text-amber-700 hover:text-amber-900 disabled:opacity-40"
              >
                ✓
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewCollectionInput(true)}
              className="px-3 py-1.5 text-sm rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
            >
              + New collection
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
      )}

      {error && (
        <div className="text-center text-red-500 py-16 text-sm">{error}</div>
      )}

      {/* Empty state: no recipes at all */}
      {hasContent && recipes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-4">🍽</p>
          <p className="text-gray-500 text-sm mb-4">No recipes yet.</p>
          <Link
            to="/recipes/new"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            Import your first recipe →
          </Link>
        </div>
      )}

      {/* Empty state: no recipes in current filter (before search) */}
      {hasContent && recipes.length > 0 && basePool.length === 0 && !isSearching && (
        <div className="text-center py-16 text-gray-400">
          {filterMode === 'mine' ? (
            <>
              <p className="text-sm">You haven't added any recipes yet.</p>
              <Link to="/recipes/new" className="mt-2 block text-sm text-amber-600 hover:underline">
                Add your first recipe →
              </Link>
            </>
          ) : (
            <p className="text-sm">No recipes in this collection yet.</p>
          )}
        </div>
      )}

      {/* No search matches */}
      {hasContent && recipes.length > 0 && isSearching && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No recipes match <span className="font-medium text-gray-600">"{query}"</span>.</p>
          <button
            onClick={() => setQuery('')}
            className="mt-2 text-sm text-amber-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {hasContent && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
