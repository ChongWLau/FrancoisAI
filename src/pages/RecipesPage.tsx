import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '@/hooks/useRecipes'
import { RecipeCard } from '@/components/recipes/RecipeCard'

export function RecipesPage() {
  const { recipes, loading, error } = useRecipes()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return recipes
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(q) ||
      recipe.recipe_ingredients.some(ing => ing.name.toLowerCase().includes(q))
    )
  }, [recipes, query])

  const isSearching = query.trim().length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Recipes</h1>
        <Link
          to="/recipes/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Recipe
        </Link>
      </div>

      {/* Search bar */}
      {!loading && !error && recipes.length > 0 && (
        <div className="relative mb-6">
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
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {loading && (
        <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
      )}

      {error && (
        <div className="text-center text-red-500 py-16 text-sm">{error}</div>
      )}

      {!loading && !error && recipes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-4">🍽</p>
          <p className="text-gray-500 text-sm mb-4">No recipes yet.</p>
          <Link
            to="/recipes/new"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Import your first recipe →
          </Link>
        </div>
      )}

      {!loading && !error && recipes.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No recipes match <span className="font-medium text-gray-600">"{query}"</span>.</p>
          <button
            onClick={() => setQuery('')}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
